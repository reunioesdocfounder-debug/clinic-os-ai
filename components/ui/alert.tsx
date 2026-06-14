import type { HTMLAttributes } from 'react';

type Tone = 'error' | 'info' | 'success';

const TONE_CLASSES: Record<Tone, string> = {
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
  success:
    'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
};

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
};

export function Alert({ tone = 'info', className = '', ...props }: AlertProps) {
  const classes = ['rounded-xl border p-3 text-sm', TONE_CLASSES[tone], className].filter(Boolean).join(' ');

  return <div className={classes} {...props} />;
}
