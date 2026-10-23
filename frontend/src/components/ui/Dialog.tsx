import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import clsx from 'clsx';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in" />
      <DialogPrimitive.Content
        className={clsx(
          'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
          'bg-surface rounded-card p-6 shadow-elevated border border-border focus:outline-none',
          'animate-in fade-in zoom-in-95 duration-150',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-input p-1 text-primary-muted hover:text-primary hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('flex flex-col space-y-1.5 text-left mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({
  className,
  children,
  ...props
}: DialogPrimitive.DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      className={clsx('text-lg font-semibold text-primary leading-none', className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({
  className,
  children,
  ...props
}: DialogPrimitive.DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={clsx('text-sm text-primary-muted', className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Description>
  );
}

export function DialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('flex items-center justify-end gap-3 mt-6', className)} {...props}>
      {children}
    </div>
  );
}
