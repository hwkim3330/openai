import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { evaluateExecution, averageScore } from './evaluator.js';
import { proposeImprovement, applyProposal } from './improver.js';

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const nowIso = () => new Date().toISOString();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const appendLog = (logFile, line) => {
  ensureDir(path.dirname(logFile));
  fs.appendFileSync(logFile, `${line}\n`, 'utf8');
};

const parseGoals = () => {
  const raw = (process.env.AGI_GOALS || '').trim();
  if (!raw) {
    return [
      'Create daily weather + traffic briefing for Seoul.',
      'Monitor stock command outputs and summarize notable changes.',
      'Keep improving prompts and commands for better user utility.'
    ];
  }
  return raw.split(';').map((x) => x.trim()).filter(Boolean);
};

const asBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const getAgiConfig = () => {
  const logFile = process.env.AGI_LOG_FILE || path.join(process.cwd(), 'logs', 'agi.log');
  const stateFile = process.env.AGI_STATE_FILE || path.join(process.cwd(), 'logs', 'agi-state.json');
  const intervalSec = Number(process.env.AGI_INTERVAL_SEC || 300);
  const maxMemory = Number(process.env.AGI_MAX_MEMORY || 50);
  const maxScoreHistory = Number(process.env.AGI_MAX_SCORE_HISTORY || 120);
  const dryRun = asBool(process.env.AGI_DRY_RUN, false);
  const enableSelfImprove = asBool(process.env.AGI_ENABLE_SELF_IMPROVE, true);
  const improveEveryCycles = Number(process.env.AGI_IMPROVE_EVERY_CYCLES || 5);
  const minAcceptScore = Number(process.env.AGI_MIN_ACCEPT_SCORE || 58);
  const rollbackDrop = Number(process.env.AGI_ROLLBACK_DROP || 4);
  const trialCommand = process.env.AGI_TRIAL_COMMAND || 'weather: Seoul';
  return {
    logFile,
    stateFile,
    intervalSec,
    maxMemory,
    maxScoreHistory,
    dryRun,
    enableSelfImprove,
    improveEveryCycles,
    minAcceptScore,
    rollbackDrop,
    trialCommand
  };
};

const makeDefaultState = () => ({
  cycles: 0,
  lastRunAt: null,
  memory: [],
  scoreHistory: [],
  lastAction: '',
  goals: parseGoals(),
  strategy: {
    plannerHint: '',
    systemPrompt: config.pollinations.systemPrompt
  },
  improvements: []
});

const loadState = (stateFile) => {
  try {
    const txt = fs.readFileSync(stateFile, 'utf8');
    const parsed = JSON.parse(txt);
    return {
      ...makeDefaultState(),
      ...parsed,
      goals: Array.isArray(parsed.goals) && parsed.goals.length ? parsed.goals : parseGoals(),
      strategy: {
        ...makeDefaultState().strategy,
        ...(parsed.strategy || {})
      },
      memory: Array.isArray(parsed.memory) ? parsed.memory : [],
      scoreHistory: Array.isArray(parsed.scoreHistory) ? parsed.scoreHistory : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : []
    };
  } catch {
    return makeDefaultState();
  }
};

const saveState = (stateFile, state) => {
  ensureDir(path.dirname(stateFile));
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
};

const extractAction = (text) => {
  const lines = String(text).split('\n').map((x) => x.trim()).filter(Boolean);
  const pref = lines.find((l) => /^(browse|weather|traffic|stock)\s*:/i.test(l));
  return pref || null;
};

const strategyPlannerHint = (strategy) => {
  const hint = String(strategy?.plannerHint || '').trim();
  return hint ? `Strategy hint: ${hint}` : '';
};

const runCycle = async ({ ai, runtime, cfg, state }) => {
  const goals = state.goals;
  const currentGoal = goals[state.cycles % goals.length];
  const recentMemory = state.memory.slice(-8).map((m) => `- ${m}`).join('\n');

  const plannerPrompt = [
    'You are an autonomous operations agent.',
    'Pick exactly one next command to execute now.',
    'Allowed commands only:',
    '- weather: <city|lat,lon>',
    '- traffic: <from> -> <to>',
    '- stock: <sym1,sym2,...>',
    '- browse: <url>',
    'Respond with one command line only.',
    strategyPlannerHint(state.strategy),
    '',
    `Goal: ${currentGoal}`,
    `Recent memory:\n${recentMemory || '- (none)'}`
  ].filter(Boolean).join('\n');

  const planText = await ai.generate(plannerPrompt);
  const action = extractAction(planText) || 'weather: Seoul';

  let result;
  if (cfg.dryRun) {
    result = `[DRY_RUN] ${action}`;
  } else {
    result = await runtime.handle(action);
  }

  const summaryPrompt = [
    'Summarize this execution in one short line for memory.',
    `Goal: ${currentGoal}`,
    `Action: ${action}`,
    `Result: ${String(result).slice(0, 1000)}`
  ].join('\n');
  const summary = await ai.generate(summaryPrompt);

  const evalResult = evaluateExecution({
    action,
    result,
    summary,
    previousAction: state.lastAction
  });

  state.cycles += 1;
  state.lastRunAt = nowIso();
  state.lastAction = action;
  state.memory.push(`${nowIso()} | goal=${currentGoal} | action=${action} | score=${evalResult.score} | ${summary.replace(/\s+/g, ' ').trim()}`);
  if (state.memory.length > cfg.maxMemory) {
    state.memory = state.memory.slice(-cfg.maxMemory);
  }

  state.scoreHistory.push({
    at: nowIso(),
    goal: currentGoal,
    action,
    score: evalResult.score,
    notes: evalResult.notes
  });
  if (state.scoreHistory.length > cfg.maxScoreHistory) {
    state.scoreHistory = state.scoreHistory.slice(-cfg.maxScoreHistory);
  }

  appendLog(cfg.logFile, `[${nowIso()}] goal=${currentGoal}`);
  appendLog(cfg.logFile, `[${nowIso()}] action=${action}`);
  appendLog(cfg.logFile, `[${nowIso()}] result=${String(result).slice(0, 600).replace(/\n/g, ' ')}`);
  appendLog(cfg.logFile, `[${nowIso()}] score=${evalResult.score} notes=${evalResult.notes.join(',') || '-'}`);
  appendLog(cfg.logFile, `[${nowIso()}] memory=${summary.replace(/\n/g, ' ')}`);
  appendLog(cfg.logFile, '---');
};

const shouldAttemptImprove = (cfg, state) => {
  if (!cfg.enableSelfImprove) return false;
  if (state.cycles < cfg.improveEveryCycles) return false;
  return state.cycles % cfg.improveEveryCycles === 0;
};

const maybeImprove = async ({ ai, runtime, cfg, state }) => {
  if (!shouldAttemptImprove(cfg, state)) return;

  const baseline = averageScore(state.scoreHistory, cfg.improveEveryCycles);
  const memoryTail = state.memory.slice(-6);
  const scoreTail = state.scoreHistory.slice(-cfg.improveEveryCycles);

  const { proposal, parseError } = await proposeImprovement({
    ai,
    goals: state.goals,
    strategy: state.strategy,
    memoryTail,
    scoreTail
  });

  if (!proposal) {
    appendLog(cfg.logFile, `[${nowIso()}] improve skip parse=${parseError || 'unknown'}`);
    return;
  }

  const snapshot = {
    strategy: { ...state.strategy },
    goals: [...state.goals],
    intervalSec: cfg.intervalSec,
    modelSystemPrompt: typeof ai.getSystemPrompt === 'function' ? ai.getSystemPrompt() : state.strategy.systemPrompt
  };

  const next = applyProposal({
    proposal,
    strategy: state.strategy,
    goals: state.goals,
    cfg
  });

  state.strategy = next.nextStrategy;
  state.goals = next.nextGoals;
  cfg.intervalSec = next.nextCfg.intervalSec;
  if (typeof ai.setSystemPrompt === 'function') {
    ai.setSystemPrompt(state.strategy.systemPrompt);
  }

  let trialScore = 0;
  let trialResult = '';
  try {
    trialResult = cfg.dryRun ? `[DRY_RUN] ${cfg.trialCommand}` : await runtime.handle(cfg.trialCommand);
    const trialEval = evaluateExecution({
      action: cfg.trialCommand,
      result: trialResult,
      summary: `trial command after proposal: ${proposal.reason}`,
      previousAction: state.lastAction
    });
    trialScore = trialEval.score;
  } catch (err) {
    trialResult = `trial error: ${err.message}`;
    trialScore = 0;
  }

  const required = Math.max(cfg.minAcceptScore, baseline - cfg.rollbackDrop);
  const accepted = trialScore >= required;

  if (!accepted) {
    state.strategy = snapshot.strategy;
    state.goals = snapshot.goals;
    cfg.intervalSec = snapshot.intervalSec;
    if (typeof ai.setSystemPrompt === 'function') {
      ai.setSystemPrompt(snapshot.modelSystemPrompt);
    }
  }

  const improvementRecord = {
    at: nowIso(),
    accepted,
    baseline,
    trialScore,
    required,
    reason: proposal.reason,
    proposal,
    trialResult: String(trialResult).slice(0, 300)
  };

  state.improvements.push(improvementRecord);
  if (state.improvements.length > 100) {
    state.improvements = state.improvements.slice(-100);
  }

  appendLog(cfg.logFile, `[${nowIso()}] improve proposal=${JSON.stringify(proposal)}`);
  appendLog(cfg.logFile, `[${nowIso()}] improve baseline=${baseline} trial=${trialScore} required=${required} accepted=${accepted}`);
  if (!accepted) {
    appendLog(cfg.logFile, `[${nowIso()}] improve rollback applied`);
  }
  appendLog(cfg.logFile, '---');
};

export const runAgiLoop = async ({ ai, runtime }) => {
  const cfg = getAgiConfig();
  const state = loadState(cfg.stateFile);
  if (typeof ai.setSystemPrompt === 'function') {
    ai.setSystemPrompt(state.strategy.systemPrompt || config.pollinations.systemPrompt);
  }

  appendLog(
    cfg.logFile,
    `[${nowIso()}] AGI loop started interval=${cfg.intervalSec}s dry_run=${cfg.dryRun} self_improve=${cfg.enableSelfImprove}`
  );

  while (true) {
    try {
      await runCycle({ ai, runtime, cfg, state });
      await maybeImprove({ ai, runtime, cfg, state });
      saveState(cfg.stateFile, state);
    } catch (err) {
      appendLog(cfg.logFile, `[${nowIso()}] cycle error: ${err.message}`);
    }
    await sleep(cfg.intervalSec * 1000);
  }
};
