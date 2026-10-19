import { describe, expect, it, vi } from 'vitest';
import { modules } from '../src/data/modules';
import { sources } from '../src/data/sources';
import {
  celebrate,
  completeAnswer,
  correctAnswer,
  earnedCount,
  freshProgress,
  loadProgress,
  ORDER,
  parseProgress,
  passed,
  placeMedal,
  recordResult,
  saveProgress,
  scoreAttempt,
  unlocked,
} from '../src/logic';
import type { Answer, Question } from '../src/types';
import katex from 'katex';

function wrong(q: Question): Answer {
  if (q.type !== 'matching') return q.options.find((o) => o.id !== q.correct)!.id;
  const values = q.left.map((l) => q.correct[l.id]);
  return Object.fromEntries(q.left.map((l, i) => [l.id, values[(i + 1) % values.length]]));
}
describe.each(modules)('$title: real quiz data', (m) => {
  it('has the agreed lesson and question structure', () => {
    expect(m.sections).toHaveLength(3);
    expect(m.outcomes).toHaveLength(2);
    expect(m.questions).toHaveLength(5);
    expect(m.questions.map((q) => q.type)).toEqual([
      'single',
      'single',
      'compare',
      'compare',
      'matching',
    ]);
    expect(new Set(m.questions.map((q) => q.id)).size).toBe(5);
    for (const q of m.questions) {
      expect(completeAnswer(q, q.correct)).toBe(true);
      expect(correctAnswer(q, q.correct)).toBe(true);
      expect(correctAnswer(q, wrong(q))).toBe(false);
      expect(completeAnswer(q, null)).toBe(false);
      if (q.type === 'matching') {
        expect(q.left).toHaveLength(3);
        expect(q.right).toHaveLength(3);
      } else expect(q.options).toHaveLength(q.type === 'single' ? 4 : 2);
    }
  });
  for (let mask = 0; mask < 32; mask++)
    it(`scores answer pattern ${mask.toString(2).padStart(5, '0')} without partial credit`, () => {
      const answers = m.questions.map((q, i) => (mask & (1 << i) ? q.correct : wrong(q)));
      expect(scoreAttempt(m, answers)).toBe(mask.toString(2).replaceAll('0', '').length);
    });
  it('rejects incomplete, unknown and duplicate matching pairs', () => {
    const q = m.questions[4];
    if (q.type !== 'matching') throw Error('Wrong format');
    expect(completeAnswer(q, {})).toBe(false);
    expect(completeAnswer(q, { [q.left[0].id]: q.right[0].id })).toBe(false);
    expect(completeAnswer(q, Object.fromEntries(q.left.map((l) => [l.id, q.right[0].id])))).toBe(
      false,
    );
    expect(completeAnswer(q, { ...q.correct, [q.left[0].id]: 'unknown' })).toBe(false);
    expect(completeAnswer(q, { ...q.correct, extra: 'r1' })).toBe(false);
    expect(() =>
      scoreAttempt(
        m,
        m.questions.slice(0, 4).map((q) => q.correct),
      ),
    ).toThrow();
    expect(() => scoreAttempt(m, [...m.questions.slice(0, 4).map((q) => q.correct), {}])).toThrow();
  });
  it('rejects an unrecognized choice ID', () =>
    expect(completeAnswer(m.questions[0], 'unknown')).toBe(false));
});
describe('sequential progress and earned medals', () => {
  it('unlocks only after passing; preserves best score through lower retakes', () => {
    let p = freshProgress();
    expect(ORDER.map((id) => unlocked(p, id))).toEqual([true, false, false]);
    p = recordResult(p, 'prompting', 3);
    expect(unlocked(p, 'context')).toBe(false);
    expect(earnedCount(p)).toBe(0);
    p = recordResult(p, 'prompting', 4, '2026-10-19T10:00:00Z');
    expect(unlocked(p, 'context')).toBe(true);
    expect(unlocked(p, 'verification')).toBe(false);
    p = placeMedal(p, 'prompting');
    p = recordResult(p, 'prompting', 1);
    expect(p.results.prompting).toEqual({ best: 4, last: 1, earnedAt: '2026-10-19T10:00:00Z' });
    expect(passed(p, 'prompting')).toBe(true);
    expect(p.placed).toEqual(['prompting']);
    expect(unlocked(p, 'context')).toBe(true);
    p = recordResult(p, 'context', 5);
    expect(unlocked(p, 'verification')).toBe(true);
  });
  it('does not award an unearned medal or duplicate a placement', () => {
    let p = freshProgress();
    expect(placeMedal(p, 'prompting')).toBe(p);
    p = placeMedal(recordResult(p, 'prompting', 5), 'prompting');
    expect(placeMedal(p, 'prompting')).toBe(p);
  });
  it('celebrates only after all three medals are placed, once', () => {
    let p = ORDER.reduce((state, id) => recordResult(state, id, 4), freshProgress());
    expect(celebrate(p)).toBe(p);
    p = placeMedal(placeMedal(p, 'prompting'), 'context');
    expect(celebrate(p)).toBe(p);
    p = placeMedal(p, 'verification');
    p = celebrate(p);
    expect(p.celebrated).toBe(true);
    expect(celebrate(p)).toBe(p);
  });
  it.each([-1, 6, 2.5, NaN, Infinity])('rejects invalid score %s', (score) =>
    expect(() => recordResult(freshProgress(), 'context', score)).toThrow(),
  );
});
describe('session persistence', () => {
  it('round trips completed results, failed retakes and animation history', () => {
    let p = ORDER.reduce((state, id) => recordResult(state, id, 5), freshProgress());
    for (const id of ORDER) p = placeMedal(p, id);
    p = celebrate(recordResult(p, 'context', 2));
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
    expect(JSON.stringify(p)).not.toContain('submissions');
  });
  it.each([
    null,
    '',
    'broken',
    'null',
    '[]',
    '{}',
    '{"version":2,"results":{}}',
    '{"version":1,"results":[]}',
  ])('recovers safely from missing or corrupt data %s', (raw) =>
    expect(parseProgress(raw)).toEqual(freshProgress()),
  );
  it.each([
    { best: 6, last: 5 },
    { best: 3, last: 4 },
    { best: 4, last: 4, earnedAt: 'broken' },
    { best: 3.5, last: 3 },
  ])('rejects malformed records %s', (r) =>
    expect(parseProgress(JSON.stringify({ version: 1, results: { prompting: r } }))).toEqual(
      freshProgress(),
    ),
  );
  it('filters unknown/unearned/duplicate medal placements and premature celebrations', () => {
    const p = recordResult(freshProgress(), 'prompting', 4);
    const restored = parseProgress(
      JSON.stringify({
        ...p,
        placed: ['context', 'prompting', 'prompting', 'unknown'],
        celebrated: true,
      }),
    );
    expect(restored.placed).toEqual(['prompting']);
    expect(restored.celebrated).toBe(false);
  });
  it('continues safely if browser storage is unavailable', () => {
    vi.stubGlobal('sessionStorage', {
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('blocked');
      },
    });
    expect(loadProgress()).toEqual(freshProgress());
    expect(saveProgress(freshProgress())).toBe(false);
    vi.unstubAllGlobals();
  });
});
describe('educational content integrity', () => {
  it('has unique reference numbers, HTTPS links, and at least two academic sources', () => {
    expect(new Set(sources.map((s) => s.id)).size).toBe(sources.length);
    expect(sources.filter((s) => s.academic).length).toBeGreaterThanOrEqual(2);
    for (const s of sources) {
      expect(new URL(s.url).protocol).toBe('https:');
      expect(s.detail.length).toBeGreaterThan(50);
    }
    for (const m of modules)
      for (const id of [...m.sources, ...m.sections.flatMap((s) => s.sources ?? [])])
        expect(sources.some((s) => s.id === id)).toBe(true);
  });
  it('renders every lesson and quiz formula without a KaTeX error', () => {
    const all = JSON.stringify(modules);
    const expressions = [...all.matchAll(/\$([^$]+)\$/g)].map((match) =>
      JSON.parse(`"${match[1]}"`),
    );
    expect(expressions.length).toBeGreaterThan(10);
    for (const expression of expressions)
      expect(() =>
        katex.renderToString(expression, { throwOnError: true, strict: 'ignore' }),
      ).not.toThrow();
  });
});
