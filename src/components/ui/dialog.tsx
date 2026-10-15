"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

/**
 * Figma dialogs: centred 520px card on desktop (D22 / D32 / D58),
 * bottom sheet on mobile (M22) or centred card (M32 / M58).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  iconTone = "muted",
  children,
  sheetOnMobile = false,
  align = "center",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName;
  iconTone?: "muted" | "gold";
  children?: ReactNode;
  sheetOnMobile?: boolean;
  align?: "center" | "start";
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--scrim)] animate-[sadu-fade-in_.2s_ease-out]" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => {
            // focus the dialog itself (announced by screen readers) instead of ringing the first button
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          className={cn(
            "fixed z-50 flex max-h-[92dvh] flex-col gap-4 overflow-y-auto bg-card shadow-sheet outline-none",
            sheetOnMobile
              ? "inset-x-0 bottom-0 rounded-t-[28px] px-5 pb-7 pt-2.5 animate-[sadu-sheet-in_.3s_cubic-bezier(.2,.8,.2,1)] sm:inset-0 sm:m-auto sm:h-fit sm:w-[520px] sm:rounded-[28px] sm:px-5 sm:py-7 sm:animate-[sadu-pop-in_.25s_ease-out]"
              : "inset-0 m-auto h-fit w-[calc(100%-48px)] max-w-[520px] rounded-[28px] px-6 pb-6 pt-7 animate-[sadu-pop-in_.25s_ease-out]",
            align === "center" && "items-center text-center",
          )}
        >
          {sheetOnMobile && <span aria-hidden className="mx-auto mb-1.5 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" />}
          {icon && (
            <span
              className={cn(
                "grid shrink-0 place-items-center rounded-[14px]",
                align === "center" ? "size-14" : "size-[52px]",
                iconTone === "gold" ? "bg-gold-subtle text-gold-text" : "bg-muted text-ink",
              )}
            >
              <Icon name={icon} size={26} />
            </span>
          )}
          <div className={cn("flex w-full flex-col gap-1.5", align === "center" && "items-center")}>
            <DialogPrimitive.Title className="t-h2 text-ink">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="t-body text-ink-2">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
