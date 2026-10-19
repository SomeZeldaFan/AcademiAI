import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  CircleCheck,
  LockKeyhole,
  RotateCcw,
  X,
  ArrowLeft,
  FlaskConical,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { modules, getModule } from './data/modules';
import { sources } from './data/sources';
import {
  celebrate,
  completeAnswer,
  correctAnswer,
  earnedCount,
  freshProgress,
  loadProgress,
  ORDER,
  passed,
  placeMedal,
  recordResult,
  saveProgress,
  scoreAttempt,
  unlocked,
} from './logic';
import { Button, Cite, CorrectLabel, Logo, Medal, NextArrow, Rich } from './ui';
import type { Answer, Attempt, CourseModule, ModuleId, Progress, Question } from './types';

const readRoute = () => window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '') || 'home';
const navItems = [
  ['home', 'Home'],
  ['learn', 'Learn'],
  ['certificates', 'My Certificates'],
  ['resources', 'Resources & References'],
  ['about', 'About'],
];
const unfinished = (a: Attempt | null) => a !== null && a.submissions.length < 5;
type Go = (route: string) => void;

function InternalLink({
  to,
  go,
  children,
  className = '',
  current,
}: {
  to: string;
  go: Go;
  children: React.ReactNode;
  className?: string;
  current?: boolean;
}) {
  return (
    <a
      href={`#/${to}`}
      className={className}
      aria-current={current ? 'page' : undefined}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          go(to);
        }
      }}
    >
      {children}
    </a>
  );
}
function Header({ route, go, progress }: { route: string; go: Go; progress: Progress }) {
  const active = ['lesson', 'quiz', 'results'].includes(route.split('/')[0]) ? 'learn' : route;
  const newMedals = ORDER.filter(
    (id) => passed(progress, id) && !progress.placed.includes(id),
  ).length;
  return (
    <header className="site-header">
      <div className="header-inner">
        <InternalLink to="home" go={go} className="brand-link">
          <Logo />
        </InternalLink>
        <nav aria-label="Main navigation">
          {navItems.map(([to, label]) => (
            <InternalLink key={to} to={to} go={go} current={active === to}>
              <span>{label}</span>
              {to === 'certificates' && newMedals > 0 && (
                <span
                  className="nav-dot"
                  aria-label={`${newMedals} new ${newMedals === 1 ? 'medal' : 'medals'}`}
                />
              )}
            </InternalLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
function Footer({ go }: { go: Go }) {
  return (
    <footer className="site-footer">
      <span>
        AcademiAI <span className="footer-separator">/</span> AI for study and research
      </span>
      <span>
        Faris Al Hajeri · Sultan Alhammadi · Rashed Al Hosani{' '}
        <InternalLink to="about" go={go}>
          About the project <ArrowUpRight size={13} />
        </InternalLink>
      </span>
    </footer>
  );
}
function ModuleRows({
  progress,
  go,
  detail = false,
}: {
  progress: Progress;
  go: Go;
  detail?: boolean;
}) {
  return (
    <div className={`module-list ${detail ? 'module-list-detail' : ''}`}>
      {modules.map((m, i) => {
        const available = unlocked(progress, m.id);
        const done = passed(progress, m.id);
        return (
          <button
            className={`module-row ${available ? 'available' : 'locked'} ${done ? 'passed' : ''}`}
            key={m.id}
            onClick={() => go(`lesson/${m.id}`)}
            disabled={!available}
            aria-label={`${m.title}, ${done ? 'passed' : available ? 'available' : 'locked'}`}
          >
            <span className="module-number">0{i + 1}</span>
            <span className="module-row-copy">
              <span className="module-row-title">{m.title}</span>
              <span className="module-row-subject">
                {m.subject}
                {detail && <span className="module-owner"> · {m.owner}</span>}
              </span>
              {detail && <span className="module-description">{m.description}</span>}
            </span>
            <span className={`status-pill ${done ? 'status-earned' : ''}`}>
              {done ? (
                <>
                  Passed <span>{progress.results[m.id]!.best}/5</span>
                </>
              ) : available ? (
                'Available'
              ) : (
                'Locked'
              )}
            </span>
            <span className="module-row-icon">
              {done ? (
                <CircleCheck size={25} />
              ) : available ? (
                <NextArrow />
              ) : (
                <LockKeyhole size={22} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
function Home({ progress, go }: { progress: Progress; go: Go }) {
  const count = earnedCount(progress);
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">For university students</p>
          <h1>
            AI for study
            <br />
            <span className="blue-text">and research.</span>
          </h1>
          <p className="hero-description">
            Three short lessons on prompting, useful context,
            <br className="wide-break" /> and checking AI’s work.
          </p>
          <Button onClick={() => go('learn')}>
            {count ? 'Continue learning' : 'Start learning'}
            <NextArrow />
          </Button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-glow" />
          {modules.map((m, i) => (
            <div key={m.id} className={`hero-medal-position hero-position-${i}`}>
              <Medal module={m} hero />
            </div>
          ))}
          <div className="hero-floor" />
        </div>
      </section>
      <section className="learning-path">
        <div className="section-heading">
          <div>
            <h2>Your learning path</h2>
            <p>Complete the modules in order.</p>
          </div>
          {count > 0 && <span className="course-count">{count} of 3 passed</span>}
        </div>
        <ModuleRows progress={progress} go={go} />
      </section>
    </div>
  );
}
function Learn({ progress, go }: { progress: Progress; go: Go }) {
  const count = earnedCount(progress);
  return (
    <div className="page learn-page">
      <p className="eyebrow">Your learning path</p>
      <div className="page-heading-row">
        <div>
          <h1>
            Three modules.
            <br />
            <span className="blue-text">One learning journey.</span>
          </h1>
          <p className="page-description">
            Read a short lesson, answer five questions, and collect its medal.
            <br />
            Pass four questions to unlock the next module.
          </p>
        </div>
        <div className="journey-progress">
          <span>
            <strong>{count}</strong> / 3
          </span>
          <p>modules passed</p>
          <div className="journey-track">
            <span style={{ width: `${(count / 3) * 100}%` }} />
          </div>
        </div>
      </div>
      <ModuleRows progress={progress} go={go} detail />
      <div className="learn-bottom">
        <span>
          <BookOpen size={17} /> Three to five minutes of reading per module
        </span>
        <span>
          <GraduationCap size={18} /> No prior AI knowledge required
        </span>
      </div>
    </div>
  );
}
function Lesson({
  module: m,
  progress,
  go,
  start,
}: {
  module: CourseModule;
  progress: Progress;
  go: Go;
  start: (id: ModuleId) => void;
}) {
  return (
    <div className="lesson-layout">
      <aside className="lesson-rail" aria-label="Course modules">
        {modules.map((other, i) => (
          <button
            key={other.id}
            disabled={!unlocked(progress, other.id)}
            className={`rail-item ${m.id === other.id ? 'rail-active' : ''}`}
            onClick={() => go(`lesson/${other.id}`)}
            aria-current={m.id === other.id ? 'step' : undefined}
          >
            <span className="rail-number">0{i + 1}</span>
            <span>{other.title}</span>
            {passed(progress, other.id) ? (
              <CircleCheck size={21} />
            ) : !unlocked(progress, other.id) ? (
              <LockKeyhole size={19} />
            ) : null}
          </button>
        ))}
        <InternalLink to="learn" go={go} className="rail-back">
          <ArrowLeft size={16} /> Learning path
        </InternalLink>
      </aside>
      <article className="lesson-article">
        <p className="eyebrow">
          Module 0{ORDER.indexOf(m.id) + 1} / {m.subject}
        </p>
        <h1>{m.title}</h1>
        <p className="lesson-meta">
          3–5 minute lesson <span>·</span> By {m.owner}
        </p>
        <div className="lesson-outcomes">
          <span className="small-label">In this lesson</span>
          {m.outcomes.map((outcome) => (
            <p key={outcome}>
              <Check size={15} />
              {outcome}
            </p>
          ))}
        </div>
        {m.sections.map((section) => (
          <section className="lesson-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((text, i) => (
              <p key={i}>
                <Rich text={text} />
                {i === section.paragraphs.length - 1 && section.sources && (
                  <>
                    {' '}
                    <Cite ids={section.sources} />
                  </>
                )}
              </p>
            ))}
          </section>
        ))}
        <section className={`worked-example worked-${m.accent}`}>
          <div className="example-heading">
            <FlaskConical size={22} />
            <div>
              <span className="small-label">Worked example</span>
              <h2>{m.example.title}</h2>
            </div>
          </div>
          <p>
            <Rich text={m.example.context} />
          </p>
          {m.example.before && (
            <div className="example-before">
              <span className="small-label">Starting point</span>
              <p>
                <Rich text={m.example.before} />
              </p>
            </div>
          )}
          <div className="example-request">
            <span className="small-label">Request to AI</span>
            <p>
              <Rich text={m.example.request} />
            </p>
          </div>
          {m.example.result.map((text, i) => (
            <p key={i}>
              <Rich text={text} />
            </p>
          ))}
          {m.example.note && <p className="example-note">{m.example.note}</p>}
        </section>
        <div className="lesson-end">
          <div>
            <h2>Ready to try it?</h2>
            <p>Five questions. Four correct answers to pass.</p>
          </div>
          <Button onClick={() => start(m.id)}>
            {passed(progress, m.id) ? 'Retake quiz' : 'Start quiz'}
            <NextArrow />
          </Button>
        </div>
        <div className="lesson-source-list">
          {m.sources.map((id) => (
            <a
              key={id}
              href={sources.find((s) => s.id === id)!.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              [{id}] {sources.find((s) => s.id === id)!.author}
              <ArrowUpRight size={13} />
            </a>
          ))}
        </div>
      </article>
    </div>
  );
}

function Matching({
  question: q,
  value,
  onChange,
  submitted,
}: {
  question: Extract<Question, { type: 'matching' }>;
  value: Record<string, string>;
  onChange: (answer: Answer) => void;
  submitted: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const selectRight = (rightId: string) => {
    if (!active || submitted) return;
    const next = { ...value };
    for (const leftId of Object.keys(next)) if (next[leftId] === rightId) delete next[leftId];
    next[active] = rightId;
    onChange(next);
    setActive(null);
  };
  return (
    <div className="matching">
      <p className="matching-instruction">
        Select an activity on the left, then its example on the right. Select a paired activity to
        change its match.
      </p>
      <div className="matching-columns">
        <div className="match-column">
          {q.left.map((item, i) => {
            const right = q.right.find((r) => r.id === value[item.id]);
            const ok = submitted && value[item.id] === q.correct[item.id];
            return (
              <button
                key={item.id}
                className={`match-item match-left ${active === item.id ? 'match-active' : ''} ${right ? 'match-paired' : ''} ${submitted ? (ok ? 'answer-correct' : 'answer-wrong') : ''}`}
                aria-pressed={active === item.id}
                disabled={submitted}
                onClick={() => setActive(item.id)}
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <span>
                  <Rich text={item.text} />
                  {right && (
                    <span className="match-pair-label">
                      Paired with {q.right.indexOf(right) + 1}
                    </span>
                  )}
                </span>
                {right && <Check size={16} />}
              </button>
            );
          })}
        </div>
        <div className="match-column">
          {q.right.map((item, i) => {
            const pairedLeft = q.left.find((l) => value[l.id] === item.id);
            return (
              <button
                key={item.id}
                className={`match-item match-right ${pairedLeft ? 'match-paired' : ''} ${active ? 'match-can-select' : ''}`}
                disabled={submitted || !active}
                onClick={() => selectRight(item.id)}
                aria-label={`Example ${i + 1}: ${item.text}`}
              >
                <span className="option-letter">{i + 1}</span>
                <span>
                  <Rich text={item.text} />
                  {pairedLeft && (
                    <span className="match-pair-label">
                      Paired with {String.fromCharCode(65 + q.left.indexOf(pairedLeft))}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="matching-count" role="status">
        {Object.keys(value).length} of 3 pairs selected
      </p>
    </div>
  );
}
function QuestionInteraction({
  question: q,
  submission,
  index,
  onSubmit,
  onNext,
  onExit,
  attemptId,
}: {
  question: Question;
  submission?: { answer: Answer };
  index: number;
  onSubmit: (a: Answer) => void;
  onNext: () => void;
  onExit: () => void;
  attemptId: string;
}) {
  const [selection, setSelection] = useState<Answer | null>(q.type === 'matching' ? {} : null);
  const reduce = useReducedMotion();
  const effectKey = useRef('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [q.id]);
  const answer = submission?.answer ?? selection;
  const submitted = !!submission;
  const correct = submitted && correctAnswer(q, answer);
  useEffect(() => {
    if (!submission) return;
    const key = `${attemptId}:${index}`;
    if (effectKey.current === key) return;
    effectKey.current = key;
    if (correct && !reduce)
      void confetti({
        particleCount: 36,
        spread: 65,
        startVelocity: 20,
        gravity: 1.1,
        origin: { x: 0.66, y: 0.67 },
        colors: ['#b49cf7', '#94bffc', '#b8efcf'],
        ticks: 110,
        disableForReducedMotion: true,
        zIndex: 80,
      });
  }, [submission, correct, reduce, attemptId, index]);
  return (
    <motion.div
      className={`question-interaction ${submitted ? (correct ? 'is-correct' : 'is-wrong') : ''}`}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="question-type small-label">
        {q.type === 'single'
          ? 'Select one answer'
          : q.type === 'compare'
            ? 'Compare and choose'
            : 'Match three pairs'}
      </div>
      <h1 ref={headingRef} tabIndex={-1}>
        <Rich text={q.prompt} />
      </h1>
      {q.scenario && (
        <p className="question-scenario">
          <Rich text={q.scenario} />
        </p>
      )}
      {q.type === 'matching' ? (
        <Matching
          question={q}
          value={(typeof answer === 'object' && answer ? answer : {}) as Record<string, string>}
          onChange={setSelection}
          submitted={submitted}
        />
      ) : (
        <div
          className={q.type === 'compare' ? 'answer-options compare-options' : 'answer-options'}
          role="radiogroup"
          aria-label="Answer choices"
        >
          {q.options.map((option, i) => {
            const selected = answer === option.id;
            const isCorrect = submitted && q.correct === option.id;
            const isWrong = submitted && selected && !isCorrect;
            return (
              <button
                key={option.id}
                className={`answer-option ${selected ? 'answer-selected' : ''} ${isCorrect ? 'answer-correct' : ''} ${isWrong ? 'answer-wrong' : ''}`}
                role="radio"
                aria-checked={selected}
                tabIndex={typeof answer === 'string' ? (selected ? 0 : -1) : i === 0 ? 0 : -1}
                disabled={submitted}
                onClick={() => setSelection(option.id)}
                onKeyDown={(e) => {
                  if (
                    submitted ||
                    !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(
                      e.key,
                    )
                  )
                    return;
                  e.preventDefault();
                  const next =
                    e.key === 'Home'
                      ? 0
                      : e.key === 'End'
                        ? q.options.length - 1
                        : (i +
                            (['ArrowRight', 'ArrowDown'].includes(e.key)
                              ? 1
                              : q.options.length - 1)) %
                          q.options.length;
                  setSelection(q.options[next].id);
                  e.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>('button')
                    [next]?.focus();
                }}
              >
                <span className="answer-radio">
                  {isCorrect ? (
                    <Check size={16} />
                  ) : isWrong ? (
                    <X size={16} />
                  ) : selected ? (
                    <span />
                  ) : null}
                </span>
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <Rich text={option.text} />
              </button>
            );
          })}
        </div>
      )}
      {submitted && (
        <motion.div
          className={`answer-feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}`}
          role="status"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className="feedback-icon">{correct ? <Check size={24} /> : <X size={24} />}</span>
          <div>
            <h2>{correct ? 'Correct' : 'Incorrect'}</h2>
            <p className="correct-answer">
              <span>Correct answer: </span>
              <CorrectLabel question={q} answer={answer!} />
            </p>
          </div>
        </motion.div>
      )}
      <div className="quiz-actions">
        <button className="text-button" onClick={onExit}>
          Exit quiz
        </button>
        {submitted ? (
          <Button onClick={onNext}>
            {index === 4 ? 'View results' : 'Next question'}
            <NextArrow />
          </Button>
        ) : (
          <Button
            disabled={!completeAnswer(q, selection)}
            onClick={() => {
              if (selection) onSubmit(selection);
            }}
          >
            Submit answer
            <NextArrow />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
function Quiz({
  module: m,
  attempt,
  onSubmit,
  onNext,
  go,
}: {
  module: CourseModule;
  attempt: Attempt;
  onSubmit: (a: Answer, index: number) => void;
  onNext: (index: number) => void;
  go: Go;
}) {
  return (
    <div className="quiz-page">
      <div className="quiz-breadcrumb">
        <span>{m.title}</span>
        <span className="breadcrumb-slash">/</span>
        <span>{m.subject}</span>
      </div>
      <div className="quiz-progress">
        <div className="quiz-track" aria-hidden="true">
          <motion.span
            animate={{ width: `${((attempt.index + 1) / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span>Question {attempt.index + 1} of 5</span>
      </div>
      <QuestionInteraction
        key={`${attempt.id}:${attempt.index}`}
        question={m.questions[attempt.index]}
        index={attempt.index}
        attemptId={attempt.id}
        submission={attempt.submissions[attempt.index]}
        onSubmit={(a) => onSubmit(a, attempt.index)}
        onNext={() => onNext(attempt.index)}
        onExit={() => go('learn')}
      />
    </div>
  );
}
function Results({
  module: m,
  progress,
  start,
  go,
}: {
  module: CourseModule;
  progress: Progress;
  start: (id: ModuleId) => void;
  go: Go;
}) {
  const result = progress.results[m.id]!;
  const success = result.last >= 4;
  const next = modules[ORDER.indexOf(m.id) + 1];
  return (
    <div className="results-page">
      <div className={`results-symbol ${success ? 'result-pass' : 'result-retry'}`}>
        {success ? <CheckCheck size={31} /> : <RotateCcw size={29} />}
      </div>
      <p className="eyebrow">{m.title} / Quiz complete</p>
      <h1>{success ? 'Module passed.' : 'Give it another try.'}</h1>
      <p className="result-description">
        {success
          ? 'Your medal is ready in My Certificates.'
          : 'Review the lesson, then try the five questions again.'}
      </p>
      <div className="score-display">
        <span>{result.last}</span>
        <span className="score-divider">/</span>
        <span>5</span>
      </div>
      <p className="score-caption">
        correct answers <span>·</span> Four required to pass
      </p>
      {result.best !== result.last && (
        <p className="retained-progress">
          Best score: {result.best}/5. Your earned medal and unlocked modules are saved.
        </p>
      )}
      <div className="results-actions">
        {success ? (
          <>
            <Button onClick={() => go('certificates')}>
              View my medal
              <NextArrow />
            </Button>
            <Button secondary onClick={() => (next ? go(`lesson/${next.id}`) : go('learn'))}>
              {next ? 'Next module' : 'Learning path'}
              <NextArrow />
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => start(m.id)}>
              Retake quiz
              <RotateCcw size={18} />
            </Button>
            <Button secondary onClick={() => go(`lesson/${m.id}`)}>
              Review lesson
              <BookOpen size={18} />
            </Button>
          </>
        )}
      </div>
      {success && (
        <button className="text-button result-retake" onClick={() => start(m.id)}>
          Retake this quiz
        </button>
      )}
    </div>
  );
}
function Collection({
  progress,
  onPlace,
  onCelebrate,
  go,
}: {
  progress: Progress;
  onPlace: (id: ModuleId) => void;
  onCelebrate: () => void;
  go: Go;
}) {
  const reduce = useReducedMotion();
  const [arriving] = useState(() =>
    ORDER.filter((id) => passed(progress, id) && !progress.placed.includes(id)),
  );
  const celebrationStarted = useRef(false);
  const [burst, setBurst] = useState(false);
  const count = earnedCount(progress);
  const next = modules.find((m) => !passed(progress, m.id));
  useEffect(() => {
    if (
      count !== 3 ||
      progress.placed.length !== 3 ||
      progress.celebrated ||
      celebrationStarted.current
    )
      return;
    celebrationStarted.current = true;
    onCelebrate();
    setBurst(true);
    if (!reduce) {
      void confetti({
        particleCount: 100,
        spread: 95,
        origin: { x: 0.5, y: 0.57 },
        colors: ['#a9caff', '#b39bf9', '#e5c282', '#edf0f7'],
        ticks: 170,
        disableForReducedMotion: true,
        zIndex: 80,
      });
    }
  }, [count, progress.placed.length, progress.celebrated, onCelebrate, reduce]);
  // Reduced motion still records medal placement without waiting for a movement.
  useEffect(() => {
    if (reduce) for (const id of arriving) onPlace(id);
  }, [reduce, arriving, onPlace]);
  return (
    <div className="collection-page">
      <p className="eyebrow">My Certificates</p>
      <h1>
        Your <span className="blue-text">medal collection</span>
      </h1>
      <p className="page-description">{count} of 3 medals collected.</p>
      <div className="medal-gallery">
        {modules.map((m, i) => {
          const earned = passed(progress, m.id);
          const pending = arriving.includes(m.id) && !progress.placed.includes(m.id);
          return (
            <div
              className={`medal-slot slot-${m.accent} ${earned ? 'slot-earned' : ''}`}
              key={m.id}
            >
              <div className="medal-stage">
                <Medal
                  module={m}
                  earned={earned}
                  pending={pending}
                  delay={arriving.indexOf(m.id) * 0.45 + 0.15}
                  onPlaced={() => onPlace(m.id)}
                />
                <div className="medal-plinth" />
              </div>
              <h2>{m.title}</h2>
              <p>{m.subject}</p>
              <span className={`status-pill ${earned ? 'status-earned' : ''}`}>
                {earned ? (
                  <>
                    <Check size={13} /> Earned
                  </>
                ) : (
                  <>
                    <LockKeyhole size={12} /> Not earned
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {count === 3 && progress.placed.length === 3 ? (
        <motion.div
          className="course-complete"
          initial={burst && !reduce ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="small-label">Journey complete</span>
          <h2>All three modules passed.</h2>
          <p>You’ve completed the AcademiAI learning journey.</p>
          <Button secondary onClick={() => go('learn')}>
            Revisit the modules
            <NextArrow />
          </Button>
        </motion.div>
      ) : (
        <div className="collection-actions">
          <Button onClick={() => go(next ? `lesson/${next.id}` : 'learn')}>
            {count === 0
              ? 'Start your first module'
              : next
                ? `Continue to ${next.shortTitle.toLowerCase()}`
                : 'Collecting your medals…'}
            <NextArrow />
          </Button>
          {count === 0 && <p>Pass a module quiz to earn its medal.</p>}
        </div>
      )}
    </div>
  );
}
function Resources() {
  return (
    <div className="page resources-page">
      <p className="eyebrow">Resources & references</p>
      <h1>
        Read the <span className="blue-text">original sources.</span>
      </h1>
      <p className="page-description">The research and documentation behind the three modules.</p>
      <section className="further-reading">
        <h2>Further reading</h2>
        <div className="resource-grid">
          {[sources[0], sources[3], sources[6]].map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              <span className="small-label">{s.kind}</span>
              <h3>
                {s.title}
                <ArrowUpRight size={20} />
              </h3>
              <p>{s.description}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="reference-section">
        <div className="section-heading">
          <h2>References</h2>
          <span className="small-label">IEEE / 7 sources</span>
        </div>
        <ol className="reference-list">
          {sources.map((s) => (
            <li key={s.id} id={`reference-${s.id}`}>
              <span className="reference-number">[{s.id}]</span>
              <div>
                <p>{s.detail}</p>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  Open source
                  <ArrowUpRight size={14} />
                </a>
              </div>
              <span className="reference-kind">{s.academic ? 'Academic source' : s.kind}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
function About() {
  return (
    <div className="page about-page">
      <p className="eyebrow">About AcademiAI</p>
      <h1>
        AI for academic work.
        <br />
        <span className="blue-text">A place to start.</span>
      </h1>
      <div className="about-intro">
        <p>
          AcademiAI helps university students use AI for studying and academic research through
          three short modules on writing prompts, providing useful context and checking AI’s
          answers. Each module uses examples from mathematics, physics or academic research,
          followed by a five-question quiz. Students who answer at least four questions correctly
          earn a medal and unlock the next module.
        </p>
      </div>
      <section className="team-section">
        <h2>The team</h2>
        <div className="team-grid">
          {modules.map((m) => (
            <div className={`team-member team-${m.accent}`} key={m.id}>
              <span className="team-initial">{m.owner[0]}</span>
              <h3>{m.owner}</h3>
              <p>{m.title}</p>
              <span>
                {m.id === 'context'
                  ? 'Research, content, website development and integration'
                  : 'Research and educational content'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function LeaveDialog({ leave, cancel }: { leave: () => void; cancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    cancelRef.current?.focus();
    return () => {
      ref.current?.close();
      previous?.focus?.();
    };
  }, []);
  return (
    <dialog
      className="leave-dialog"
      ref={ref}
      aria-labelledby="leave-title"
      onCancel={(e) => {
        e.preventDefault();
        cancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div className="dialog-inner">
        <span className="dialog-symbol">
          <ArrowLeft size={22} />
        </span>
        <h2 id="leave-title">Leave this quiz?</h2>
        <p>
          This unfinished attempt will be discarded. Your completed results and earned medals will
          stay saved.
        </p>
        <div className="dialog-actions">
          <button ref={cancelRef} className="button button-secondary" onClick={cancel}>
            Keep learning
          </button>
          <Button onClick={leave}>
            Leave quiz
            <NextArrow />
          </Button>
        </div>
      </div>
    </dialog>
  );
}

function CourseApp() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [route, setRoute] = useState(readRoute);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const routeRef = useRef(route);
  const attemptRef = useRef(attempt);
  const mainRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const commitRoute = useCallback((target: string) => {
    routeRef.current = target;
    setRoute(target);
    if (readRoute() !== target) window.location.hash = `/${target}`;
  }, []);
  const go = useCallback(
    (target: string) => {
      if (target === routeRef.current) return;
      if (unfinished(attemptRef.current)) {
        setLeaving(target);
        return;
      }
      attemptRef.current = null;
      setAttempt(null);
      commitRoute(target);
    },
    [commitRoute],
  );
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);
  useEffect(() => {
    const onHash = () => {
      const target = readRoute();
      if (target === routeRef.current) return;
      if (unfinished(attemptRef.current)) {
        history.replaceState(null, '', `#/${routeRef.current}`);
        setLeaving(target);
      } else {
        attemptRef.current = null;
        setAttempt(null);
        routeRef.current = target;
        setRoute(target);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    mainRef.current?.focus({ preventScroll: true });
    const name =
      getModule(route.split('/')[1] ?? '')?.title ??
      navItems.find(([key]) => key === route)?.[1] ??
      'Learning';
    document.title = `${name} — AcademiAI`;
  }, [route]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  const [section, moduleId] = route.split('/');
  const current = getModule(moduleId ?? '');
  useEffect(() => {
    if (!['lesson', 'quiz', 'results'].includes(section)) return;
    if (!current || !unlocked(progress, current.id)) {
      setNotice('Pass the preceding module to continue.');
      attemptRef.current = null;
      setAttempt(null);
      commitRoute('learn');
      return;
    }
    if (section === 'quiz' && (!attempt || attempt.moduleId !== current.id)) {
      commitRoute(`lesson/${current.id}`);
      return;
    }
    if (section === 'results' && !progress.results[current.id]) commitRoute(`lesson/${current.id}`);
  }, [section, current, progress, attempt, commitRoute]);
  const start = (id: ModuleId) => {
    if (!unlocked(progress, id)) return;
    const next: Attempt = { id: crypto.randomUUID(), moduleId: id, index: 0, submissions: [] };
    attemptRef.current = next;
    setAttempt(next);
    commitRoute(`quiz/${id}`);
  };
  const submit = (answer: Answer, index: number) => {
    const a = attemptRef.current;
    if (!a || a.index !== index || a.submissions[index]) return;
    const m = getModule(a.moduleId)!;
    if (!completeAnswer(m.questions[index], answer)) return;
    const next = { ...a, submissions: [...a.submissions, { answer }] };
    attemptRef.current = next;
    setAttempt(next);
    if (next.submissions.length === 5) {
      const score = scoreAttempt(
        m,
        next.submissions.map((s) => s.answer),
      );
      setProgress((p) => recordResult(p, m.id, score));
    }
  };
  const nextQuestion = (index: number) => {
    const a = attemptRef.current;
    if (!a || a.index !== index || !a.submissions[index]) return;
    if (index === 4) {
      attemptRef.current = null;
      setAttempt(null);
      commitRoute(`results/${a.moduleId}`);
    } else {
      const next = { ...a, index: a.index + 1 };
      attemptRef.current = next;
      setAttempt(next);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };
  const markPlaced = useCallback((id: ModuleId) => setProgress((p) => placeMedal(p, id)), []);
  const markCelebrated = useCallback(() => setProgress((p) => celebrate(p)), []);
  let content: React.ReactNode;
  if (route === 'home') content = <Home progress={progress} go={go} />;
  else if (route === 'learn') content = <Learn progress={progress} go={go} />;
  else if (route === 'certificates')
    content = (
      <Collection progress={progress} go={go} onPlace={markPlaced} onCelebrate={markCelebrated} />
    );
  else if (route === 'resources') content = <Resources />;
  else if (route === 'about') content = <About />;
  else if (section === 'lesson' && current && unlocked(progress, current.id))
    content = <Lesson module={current} progress={progress} go={go} start={start} />;
  else if (
    section === 'quiz' &&
    current &&
    attempt &&
    attempt.moduleId === current.id &&
    unlocked(progress, current.id)
  )
    content = (
      <Quiz module={current} attempt={attempt} onSubmit={submit} onNext={nextQuestion} go={go} />
    );
  else if (
    section === 'results' &&
    current &&
    progress.results[current.id] &&
    unlocked(progress, current.id)
  )
    content = <Results module={current} progress={progress} start={start} go={go} />;
  else if (['lesson', 'quiz', 'results'].includes(section))
    content = <Learn progress={progress} go={go} />;
  else
    content = (
      <div className="page not-found">
        <p className="eyebrow">Page not found</p>
        <h1>Back to the learning path.</h1>
        <Button onClick={() => go('learn')}>
          View modules
          <NextArrow />
        </Button>
      </div>
    );
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      <Header route={route} go={go} progress={progress} />
      <main id="main-content" tabIndex={-1} ref={mainRef}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={route}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -5 }}
            transition={{ duration: 0.16 }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer go={go} />
      {notice && (
        <div className="toast" role="status">
          <LockKeyhole size={17} />
          {notice}
          <button onClick={() => setNotice('')} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}
      {leaving && (
        <LeaveDialog
          cancel={() => setLeaving(null)}
          leave={() => {
            const target = leaving;
            setLeaving(null);
            attemptRef.current = null;
            setAttempt(null);
            commitRoute(target);
          }}
        />
      )}
    </>
  );
}

function ComponentPreview() {
  const [type, setType] = useState(0);
  const [submission, setSubmission] = useState<{ answer: Answer } | undefined>();
  const [epoch, setEpoch] = useState(0);
  const [p, setP] = useState(() =>
    ORDER.reduce((state, id) => recordResult(state, id, 5), freshProgress()),
  );
  const q = modules[1].questions[[0, 2, 4][type % 3]];
  const change = (n: number) => {
    setType(n);
    setSubmission(undefined);
    setEpoch((e) => e + 1);
    if (n === 3) setP(ORDER.reduce((state, id) => recordResult(state, id, 5), freshProgress()));
  };
  return (
    <>
      <header className="preview-header">
        <Logo />
        <span>Local component preview · isolated state</span>
        <a href="#/home" onClick={() => window.location.assign(window.location.pathname)}>
          Open the site
        </a>
      </header>
      <div className="preview-controls">
        {['Single choice', 'Compare and choose', 'Matching', 'Medal collection'].map((label, i) => (
          <Button key={label} secondary={type !== i} onClick={() => change(i)}>
            {label}
          </Button>
        ))}
        <Button secondary onClick={() => change(type)}>
          Reset preview
        </Button>
      </div>
      {type === 3 ? (
        <Collection
          key={epoch}
          progress={p}
          go={() => {}}
          onPlace={(id) => setP((old) => placeMedal(old, id))}
          onCelebrate={() => setP(celebrate)}
        />
      ) : (
        <div className="quiz-page">
          <QuestionInteraction
            key={epoch}
            question={q}
            index={0}
            attemptId={`preview-${epoch}`}
            submission={submission}
            onSubmit={(answer) => setSubmission({ answer })}
            onNext={() => change(type)}
            onExit={() => change(type)}
          />
        </div>
      )}
    </>
  );
}
export default function App() {
  return import.meta.env.DEV && readRoute() === 'preview' ? <ComponentPreview /> : <CourseApp />;
}
