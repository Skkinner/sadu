"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

// Figma › Components › Input Field (Default / Focus / Filled / Error)
const fieldBox =
  "flex h-14 items-center gap-3 rounded-[14px] border-[1.5px] border-line-strong bg-card px-4 transition-colors focus-within:border-2 focus-within:border-action focus-within:px-[15.5px]";
const fieldError = "border-2 border-error px-[15.5px] focus-within:border-error";

type FieldShellProps = {
  id: string;
  label: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function FieldShell({ id, label, helper, error, className, children }: FieldShellProps) {
  const message = error || helper;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="t-label text-ink">
        {label}
      </label>
      {children}
      {message && (
        <p id={`${id}-msg`} className={cn("flex items-start gap-1.5 t-caption", error ? "text-error" : "text-ink-2")}>
          <Icon name="info" size={18} className="mt-px" />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  icon?: IconName;
  helper?: ReactNode;
  error?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
};

export function InputField({ label, icon, helper, error, trailing, containerClassName, className, id, ...props }: InputFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} helper={helper} error={error} className={containerClassName}>
      <div className={cn(fieldBox, error && fieldError)}>
        {icon && <Icon name={icon} size={22} className="text-ink-2" />}
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || helper ? `${fieldId}-msg` : undefined}
          className={cn("h-full min-w-0 flex-1 bg-transparent t-body text-ink outline-none placeholder:text-ink-3", className)}
          {...props}
        />
        {trailing}
      </div>
    </FieldShell>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode;
  icon?: IconName;
  helper?: ReactNode;
  options: { value: string; label: string }[];
  containerClassName?: string;
};

export function SelectField({ label, icon, helper, options, containerClassName, className, id, ...props }: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} helper={helper} className={containerClassName}>
      <div className={cn(fieldBox, "relative")}>
        {icon && <Icon name={icon} size={22} className="text-ink-2" />}
        <select
          id={fieldId}
          aria-describedby={helper ? `${fieldId}-msg` : undefined}
          className={cn("h-full min-w-0 flex-1 appearance-none bg-transparent pe-8 t-body text-ink outline-none", className)}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-card text-ink">
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size={20} className="pointer-events-none absolute end-4 text-ink-2" />
      </div>
    </FieldShell>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: ReactNode;
  footer?: ReactNode;
  error?: ReactNode;
};

export function TextAreaField({ label, footer, error, className, id, ...props }: TextAreaFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="t-label text-ink">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-[140px] resize-y rounded-[14px] border-[1.5px] border-line-strong bg-card p-4 t-body text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-2 focus:border-action focus:p-[15.5px]",
          error && "border-2 border-error p-[15.5px] focus:border-error",
          className,
        )}
        {...props}
      />
      {footer}
    </div>
  );
}
