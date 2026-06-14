import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  padding?: string;
};

export function Card({ className = '', interactive = false, padding = 'p-5', ...props }: CardProps) {
  const classes = [
    'rounded-3xl border border-border bg-surface shadow-card',
    padding,
    interactive
      ? 'transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-hover hover:shadow-card-hover'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes} {...props} />;
}
