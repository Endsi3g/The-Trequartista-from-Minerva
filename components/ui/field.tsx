import * as React from 'react';
import { cn } from '@/lib/utils';

// ── FieldGroup ──────────────────────────────────────────
function FieldGroup({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  );
}

// ── Field ───────────────────────────────────────────────
function Field({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field"
      className={cn('flex flex-col gap-1.5', className)}
      {...props}
    />
  );
}

// ── FieldLabel ──────────────────────────────────────────
function FieldLabel({
  className,
  htmlFor,
  ...props
}: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="field-label"
      htmlFor={htmlFor}
      className={cn(
        'text-xs font-semibold text-mv-ink leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
}

// ── FieldDescription ────────────────────────────────────
function FieldDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-xs text-mv-ink-soft [&_a]:text-mv-green [&_a]:font-medium [&_a:hover]:underline', className)}
      {...props}
    />
  );
}

// ── FieldSeparator ──────────────────────────────────────
function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-separator"
      className={cn('relative flex items-center gap-3', className)}
      {...props}
    >
      <div className="h-px flex-1 bg-mv-border" />
      {children && (
        <span className="text-xs text-mv-ink-soft shrink-0">{children}</span>
      )}
      <div className="h-px flex-1 bg-mv-border" />
    </div>
  );
}

export { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator };
