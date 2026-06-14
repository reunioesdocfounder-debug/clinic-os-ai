import type { HTMLAttributes } from 'react';

export type BadgeTone = 'gray' | 'red' | 'orange' | 'yellow' | 'blue' | 'green';
type Tone = BadgeTone;

const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export function Badge({ tone = 'gray', className = '', ...props }: BadgeProps) {
  const classes = [
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
    TONE_CLASSES[tone],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes} {...props} />;
}
