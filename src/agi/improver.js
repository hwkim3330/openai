const JSON_BLOCK = /```json\s*([\s\S]*?)```/i;

const extractJsonText = (raw) => {
  const text = String(raw || '').trim();
  const fence = text.match(JSON_BLOCK);
  if (fence?.[1]) return fence[1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return '';
};

const safeJsonParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const trimOneLine = (v, max = 240) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);

const clampNum = (value, min, max, fallback) => {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

export const proposeImprovement = async ({ ai, goals, strategy, memoryTail, scoreTail }) => {
  const prompt = [
    'You are a reliability engineer for an autonomous assistant.',
    'Return a compact JSON proposal only. No prose.',
    'Proposal schema:',
    '{',
    '  "plannerHint": "string <= 240 chars (optional)",',
    '  "appendSystemPrompt": "string <= 240 chars (optional)",',
    '  "addGoal": "string <= 180 chars (optional)",',
    '  "intervalSec": "number in [60, 1800] (optional)",',
    '  "reason": "one-line reason"',
    '}',
    'Constraints:',
    '- Focus on measurable reliability gains',
    '- Avoid risky or broad changes',
    '- Keep proposal minimal (at most 2 changed fields besides reason)',
    '',
    `Current goals: ${JSON.stringify(goals)}`,
    `Current strategy: ${JSON.stringify(strategy)}`,
    `Recent memory: ${JSON.stringify(memoryTail)}`,
    `Recent score tail: ${JSON.stringify(scoreTail)}`
  ].join('\n');

  const raw = await ai.generate(prompt);
  const parsed = safeJsonParse(extractJsonText(raw));
  if (!parsed || typeof parsed !== 'object') {
    return { proposal: null, parseError: 'invalid_json', raw };
  }

  const proposal = {
    plannerHint: parsed.plannerHint ? trimOneLine(parsed.plannerHint) : '',
    appendSystemPrompt: parsed.appendSystemPrompt ? trimOneLine(parsed.appendSystemPrompt) : '',
    addGoal: parsed.addGoal ? trimOneLine(parsed.addGoal, 180) : '',
    intervalSec: parsed.intervalSec === undefined ? null : clampNum(parsed.intervalSec, 60, 1800, null),
    reason: trimOneLine(parsed.reason || 'no_reason', 160)
  };

  const changed = [
    proposal.plannerHint ? 'plannerHint' : '',
    proposal.appendSystemPrompt ? 'appendSystemPrompt' : '',
    proposal.addGoal ? 'addGoal' : '',
    proposal.intervalSec !== null ? 'intervalSec' : ''
  ].filter(Boolean);

  if (changed.length === 0) {
    return { proposal: null, parseError: 'empty_proposal', raw };
  }
  if (changed.length > 2) {
    return { proposal: null, parseError: 'too_many_changes', raw };
  }

  return { proposal, parseError: null, raw };
};

export const applyProposal = ({ proposal, strategy, goals, cfg }) => {
  const nextStrategy = { ...strategy };
  const nextGoals = [...goals];
  const nextCfg = { ...cfg };

  if (proposal.plannerHint) {
    nextStrategy.plannerHint = proposal.plannerHint;
  }

  if (proposal.appendSystemPrompt) {
    const base = String(nextStrategy.systemPrompt || '').trim();
    const combined = `${base}\n${proposal.appendSystemPrompt}`.trim();
    nextStrategy.systemPrompt = combined.slice(0, 800);
  }

  if (proposal.addGoal) {
    const exists = nextGoals.some((g) => String(g).toLowerCase() === proposal.addGoal.toLowerCase());
    if (!exists) nextGoals.push(proposal.addGoal);
  }

  if (proposal.intervalSec !== null) {
    nextCfg.intervalSec = proposal.intervalSec;
  }

  return { nextStrategy, nextGoals, nextCfg };
};
