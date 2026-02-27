const ERROR_PATTERNS = [
  /error/i,
  /failed/i,
  /timeout/i,
  /denied/i,
  /unauthorized/i,
  /http 4\d\d/i,
  /http 5\d\d/i
];

const hasErrorSignal = (text) => ERROR_PATTERNS.some((p) => p.test(text));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const avg = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

export const evaluateExecution = ({ action, result, summary, previousAction }) => {
  const rawResult = String(result || '');
  const rawSummary = String(summary || '');
  const actionText = String(action || '').trim();

  let score = 50;
  const notes = [];

  if (actionText) {
    score += 5;
  } else {
    score -= 15;
    notes.push('missing_action');
  }

  if (rawResult.length > 120) {
    score += 10;
    notes.push('result_rich');
  } else if (rawResult.length > 20) {
    score += 4;
  } else {
    score -= 8;
    notes.push('result_too_short');
  }

  if (hasErrorSignal(rawResult)) {
    score -= 25;
    notes.push('result_error_signal');
  }

  if (rawSummary.length > 15) {
    score += 5;
  } else {
    score -= 5;
  }

  if (previousAction && previousAction === actionText) {
    score -= 6;
    notes.push('repeated_action');
  }

  return {
    score: clamp(score, 0, 100),
    notes
  };
};

export const averageScore = (scoreHistory, windowSize = 5) => {
  const values = (scoreHistory || []).slice(-windowSize).map((x) => Number(x.score || 0));
  return Number(avg(values).toFixed(2));
};
