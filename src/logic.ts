import type { Answer, CourseModule, ModuleId, Progress, Question } from './types';

export const ORDER: ModuleId[] = ['prompting', 'context', 'verification'];
export const SESSION_KEY = 'academiai.journey.v1';
export const PASS_SCORE = 4;
export const QUESTION_COUNT = 5;
export const freshProgress = (): Progress => ({
  version: 1,
  results: {},
  placed: [],
  celebrated: false,
});
export const passed = (p: Progress, id: ModuleId) => (p.results[id]?.best ?? -1) >= PASS_SCORE;
export const unlocked = (p: Progress, id: ModuleId) =>
  ORDER.slice(0, ORDER.indexOf(id)).every((previous) => passed(p, previous));
export const earnedCount = (p: Progress) => ORDER.filter((id) => passed(p, id)).length;
export function completeAnswer(q: Question, answer: Answer | null): boolean {
  if (!answer) return false;
  if (q.type !== 'matching')
    return typeof answer === 'string' && q.options.some((o) => o.id === answer);
  if (typeof answer !== 'object' || Object.keys(answer).length !== q.left.length) return false;
  const values = q.left.map((item) => answer[item.id]);
  return (
    new Set(values).size === q.left.length &&
    values.every((value) => q.right.some((item) => item.id === value))
  );
}
export function correctAnswer(q: Question, answer: Answer | null): boolean {
  if (!completeAnswer(q, answer)) return false;
  if (q.type !== 'matching') return answer === q.correct;
  return q.left.every((item) => (answer as Record<string, string>)[item.id] === q.correct[item.id]);
}
export function scoreAttempt(module: CourseModule, answers: Answer[]): number {
  if (answers.length !== QUESTION_COUNT)
    throw new Error('An attempt must contain five complete answers.');
  if (!module.questions.every((q, i) => completeAnswer(q, answers[i])))
    throw new Error('Incomplete answer.');
  return module.questions.reduce((score, q, i) => score + Number(correctAnswer(q, answers[i])), 0);
}
export function recordResult(
  p: Progress,
  id: ModuleId,
  score: number,
  date = new Date().toISOString(),
): Progress {
  if (!Number.isInteger(score) || score < 0 || score > QUESTION_COUNT)
    throw new Error('Invalid score.');
  const previous = p.results[id];
  const best = Math.max(previous?.best ?? 0, score);
  return {
    ...p,
    results: {
      ...p.results,
      [id]: {
        best,
        last: score,
        earnedAt: previous?.earnedAt ?? (best >= PASS_SCORE ? date : null),
      },
    },
  };
}
export function placeMedal(p: Progress, id: ModuleId): Progress {
  return !passed(p, id) || p.placed.includes(id) ? p : { ...p, placed: [...p.placed, id] };
}
export function celebrate(p: Progress): Progress {
  return earnedCount(p) === ORDER.length &&
    ORDER.every((id) => p.placed.includes(id)) &&
    !p.celebrated
    ? { ...p, celebrated: true }
    : p;
}
export function parseProgress(raw: string | null): Progress {
  if (!raw) return freshProgress();
  try {
    const data = JSON.parse(raw);
    if (
      data?.version !== 1 ||
      !data.results ||
      typeof data.results !== 'object' ||
      Array.isArray(data.results)
    )
      return freshProgress();
    const p = freshProgress();
    for (const id of ORDER) {
      const r = data.results[id];
      if (!r) continue;
      if (
        !Number.isInteger(r.best) ||
        !Number.isInteger(r.last) ||
        r.best < 0 ||
        r.best > 5 ||
        r.last < 0 ||
        r.last > r.best
      )
        return freshProgress();
      if (
        r.best >= PASS_SCORE &&
        (typeof r.earnedAt !== 'string' || !Number.isFinite(Date.parse(r.earnedAt)))
      )
        return freshProgress();
      p.results[id] = {
        best: r.best,
        last: r.last,
        earnedAt: r.best >= PASS_SCORE ? r.earnedAt : null,
      };
    }
    if (Array.isArray(data.placed))
      p.placed = ORDER.filter((id) => data.placed.includes(id) && passed(p, id));
    p.celebrated = data.celebrated === true && p.placed.length === 3;
    return p;
  } catch {
    return freshProgress();
  }
}
export function loadProgress(): Progress {
  try {
    return parseProgress(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return freshProgress();
  }
}
export function saveProgress(p: Progress): boolean {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
