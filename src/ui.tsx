import { Fragment, useId, useMemo, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import katex from 'katex';
import type { CourseModule } from './types';
import { sources } from './data/sources';

export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
export function Logo({ small = false }: { small?: boolean }) {
  const gradientId = useId();
  return (
    <span className={`brand ${small ? 'brand-small' : ''}`}>
      <svg className="brand-symbol" viewBox="0 0 70 58" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="70" y1="10" y2="50">
            <stop stopColor="#aacdff" />
            <stop offset="1" stopColor="#b497f5" />
          </linearGradient>
        </defs>
        <path
          d="M8 46 25 12q3-6 6 0l18 34"
          stroke={`url(#${gradientId})`}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m27 46 14-29q3-6 6 0l15 29"
          stroke="#ad92ed"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M28 35 23 46" stroke="#15171d" strokeWidth="3" />
      </svg>
      <span>
        Academi<span className="brand-ai">AI</span>
      </span>
    </span>
  );
}
export function Rich({ text, className = '' }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const result: React.ReactNode[] = [];
    const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    let from = 0;
    let match;
    while ((match = re.exec(text))) {
      if (match.index > from) result.push(text.slice(from, match.index));
      const html = katex.renderToString(match[1] ?? match[2], {
        displayMode: !!match[1],
        throwOnError: false,
        strict: 'ignore',
        trust: false,
        output: 'htmlAndMathml',
      });
      result.push(
        <span
          key={match.index}
          className={match[1] ? 'math-display' : 'math-inline'}
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      );
      from = re.lastIndex;
    }
    if (from < text.length) result.push(text.slice(from));
    return result;
  }, [text]);
  return <span className={className}>{parts}</span>;
}
export function Cite({ ids }: { ids: number[] }) {
  return (
    <span className="citations">
      {ids.map((id) => (
        <a
          key={id}
          href={sources.find((s) => s.id === id)!.url}
          target="_blank"
          rel="noopener noreferrer"
          title={sources.find((s) => s.id === id)!.title}
        >
          [{id}]
        </a>
      ))}
    </span>
  );
}
export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={`${secondary ? 'button button-secondary' : 'button'} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function NextArrow() {
  return <ArrowRight size={20} strokeWidth={1.7} aria-hidden="true" />;
}
export function Medal({
  module,
  earned = true,
  hero = false,
  pending = false,
  delay = 0,
  onPlaced,
}: {
  module: CourseModule;
  earned?: boolean;
  hero?: boolean;
  pending?: boolean;
  delay?: number;
  onPlaced?: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`medal-object medal-${module.accent} ${!earned ? 'medal-locked' : ''} ${hero ? 'hero-medal' : ''}`}
      style={
        {
          '--medal-accent':
            module.accent === 'blue'
              ? '#95c5ff'
              : module.accent === 'violet'
                ? '#b69cf9'
                : '#dfbd78',
        } as CSSProperties
      }
      initial={
        pending && !reduce
          ? { opacity: 0, y: -110, rotateY: 30, scale: 0.8 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 18, delay: reduce ? 0 : delay }}
      onAnimationComplete={pending ? onPlaced : undefined}
      whileHover={earned && !reduce ? { y: -8, rotateZ: hero ? 0 : -2 } : undefined}
    >
      <div className="medal-halo" />
      <img
        src={asset(`medal-${module.id}.webp`)}
        width="680"
        height="680"
        alt={hero ? '' : `${module.shortTitle} medal${earned ? '' : ', not yet earned'}`}
        loading={hero ? 'eager' : 'lazy'}
        decoding="async"
      />
      {!earned && !hero && (
        <span className="medal-lock">
          <LockKeyhole size={24} />
        </span>
      )}
      {pending && <span className="placement-ring" aria-hidden="true" />}
    </motion.div>
  );
}
export function CorrectLabel({
  question,
  answer,
}: {
  question: import('./types').Question;
  answer: import('./types').Answer;
}) {
  if (question.type !== 'matching')
    return <Rich text={question.options.find((o) => o.id === question.correct)!.text} />;
  return (
    <span className="pair-answer-list">
      {question.left.map((item) => (
        <Fragment key={item.id}>
          <span>
            <Rich text={item.text} /> <span aria-hidden="true">→</span>{' '}
            <Rich text={question.right.find((r) => r.id === question.correct[item.id])!.text} />
          </span>
        </Fragment>
      ))}
    </span>
  );
}
