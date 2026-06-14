import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const FIELD_CLASSES =
  'mt-1 block w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  const classes = ['block text-sm font-medium text-foreground', className].filter(Boolean).join(' ');

  return <label className={classes} {...props} />;
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const classes = [FIELD_CLASSES, className].filter(Boolean).join(' ');

  return <input className={classes} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const classes = [FIELD_CLASSES, className].filter(Boolean).join(' ');

  return <textarea className={classes} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const classes = [FIELD_CLASSES, className].filter(Boolean).join(' ');

  return <select className={classes} {...props} />;
}

export function Checkbox({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const classes = ['h-4 w-4 rounded border-border text-accent focus:ring-accent', className]
    .filter(Boolean)
    .join(' ');

  return <input type="checkbox" className={classes} {...props} />;
}
