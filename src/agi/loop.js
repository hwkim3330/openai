import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { PollinationsClient } from '../pollinations.js';
import { ChromeAdapter } from '../chromeAdapter.js';
import { RuntimeEngine } from '../runtime/engine.js';

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const nowIso = () => new Date().toISOString();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const appendLog = (logFile, line) => {
  ensureDir(path.dirname(logFile));
  fs.appendFileSync(logFile, `${line}\n`, 'utf8');
};

const loadState = (stateFile) => {
  try {
    const txt = fs.readFileSync(stateFile, 'utf8');
    return JSON.parse(txt);
  } catch {
    return {
      cycles: 0,
      lastRunAt: null,
      memory: []
    };
  }
};

const saveState = (stateFile, state) => {
  ensureDir(path.dirname(stateFile));
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
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

const getAgiConfig = () => {
  const logFile = process.env.AGI_LOG_FILE || path.join(process.cwd(), 'logs', 'agi.log');
  const stateFile = process.env.AGI_STATE_FILE || path.join(process.cwd(), 'logs', 'agi-state.json');
  const intervalSec = Number(process.env.AGI_INTERVAL_SEC || 300);
  const maxMemory = Number(process.env.AGI_MAX_MEMORY || 50);
  const dryRun = ['1', 'true', 'yes', 'on'].includes(String(process.env.AGI_DRY_RUN || 'false').toLowerCase());
  return { logFile, stateFile, intervalSec, maxMemory, dryRun };
};

const extractAction = (text) => {
  const lines = String(text).split('\n').map((x) => x.trim()).filter(Boolean);
  const pref = lines.find((l) => /^(browse|weather|traffic|stock)\s*:/i.test(l));
  return pref || null;
};

const runCycle = async ({ ai, runtime, goals, cfg, state }) => {
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
    '',
    `Goal: ${currentGoal}`,
    `Recent memory:\n${recentMemory || '- (none)'}`
  ].join('\n');

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

  state.cycles += 1;
  state.lastRunAt = nowIso();
  state.memory.push(`${nowIso()} | goal=${currentGoal} | action=${action} | ${summary.replace(/\s+/g, ' ').trim()}`);
  if (state.memory.length > cfg.maxMemory) {
    state.memory = state.memory.slice(-cfg.maxMemory);
  }

  appendLog(cfg.logFile, `[${nowIso()}] goal=${currentGoal}`);
  appendLog(cfg.logFile, `[${nowIso()}] action=${action}`);
  appendLog(cfg.logFile, `[${nowIso()}] result=${String(result).slice(0, 600).replace(/\n/g, ' ')}`);
  appendLog(cfg.logFile, `[${nowIso()}] memory=${summary.replace(/\n/g, ' ')}`);
  appendLog(cfg.logFile, '---');
};

export const runAgiLoop = async () => {
  const cfg = getAgiConfig();
  const goals = parseGoals();
  const state = loadState(cfg.stateFile);

  const ai = new PollinationsClient(config.pollinations);
  const chrome = new ChromeAdapter(config.browser);
  const runtime = new RuntimeEngine({ ai, chrome });

  appendLog(cfg.logFile, `[${nowIso()}] AGI loop started interval=${cfg.intervalSec}s dry_run=${cfg.dryRun}`);

  while (true) {
    try {
      await runCycle({ ai, runtime, goals, cfg, state });
      saveState(cfg.stateFile, state);
    } catch (err) {
      appendLog(cfg.logFile, `[${nowIso()}] cycle error: ${err.message}`);
    }
    await sleep(cfg.intervalSec * 1000);
  }
};
