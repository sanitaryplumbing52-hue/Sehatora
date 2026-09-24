import clsx from "clsx";
import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClasses =
  "w-full h-10 rounded-lg border border-border bg-white px-3 text-sm text-ink placeholder:text-muted " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "dark:bg-surface-dark-card dark:border-border-dark dark:text-slate-100";

export function Label({ children, className, ...props }: LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) {
  return (
    <label className={clsx("mb-1.5 block text-sm font-medium text-ink dark:text-slate-200", className)} {...props}>
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(fieldClasses, "h-auto py-2 resize-y min-h-[90px]", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(fieldClasses, "appearance-none pr-8 bg-no-repeat", className)} {...props}>
      {children}
    </select>
  );
}

export function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
