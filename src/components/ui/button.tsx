import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

// Figma › Components › Button (Primary / Secondary / Ghost, Medium 48 / Large 56, radius 14)
export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2.5 rounded-[14px] t-button whitespace-nowrap transition-[background-color,color,box-shadow,filter,opacity] duration-150 disabled:pointer-events-none aria-disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-action text-on-action hover:brightness-110 active:brightness-95 disabled:bg-muted disabled:text-ink-3 aria-disabled:bg-muted aria-disabled:text-ink-3",
        secondary:
          "border-[1.5px] border-line-strong bg-card text-ink hover:bg-muted disabled:border-line disabled:text-ink-3",
        ghost: "text-action hover:bg-action-subtle disabled:text-ink-3",
        inverse: "bg-on-inverse/12 text-on-inverse hover:bg-on-inverse/20",
      },
      size: {
        sm: "h-10 px-4",
        md: "h-12 px-5",
        lg: "h-14 px-6",
        link: "h-auto p-0 hover:bg-transparent hover:underline underline-offset-4",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** trailing icon, e.g. "arrow-right" */
    trailing?: IconName;
    leading?: IconName;
    children?: ReactNode;
  };

export function Button({ className, variant, size, block, asChild, trailing, leading, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const content = asChild ? (
    children
  ) : (
    <>
      {leading && <Icon name={leading} size={20} />}
      {children}
      {trailing && <Icon name={trailing} size={20} />}
    </>
  );
  return (
    <Comp className={cn(buttonVariants({ variant, size, block }), className)} {...(!asChild && { type: "button" })} {...props}>
      {content}
    </Comp>
  );
}

/** Use inside <Button asChild><Link>…<ButtonIcon/></Link></Button> */
export function ButtonIcon({ name }: { name: IconName }) {
  return <Icon name={name} size={20} />;
}

// Figma › Shared › Icon Button (Muted / Primary / Outline, 40 & 48)
export const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50",
  {
    variants: {
      variant: {
        muted: "bg-muted text-ink hover:bg-line",
        primary: "bg-action text-on-action hover:brightness-110",
        outline: "border-[1.5px] border-line bg-card text-ink hover:bg-muted",
        ghost: "text-ink hover:bg-muted",
        inverse: "border-[1.5px] border-on-inverse/80 text-on-inverse hover:bg-on-inverse/10",
      },
      size: { 40: "size-10", 44: "size-11", 48: "size-12", 56: "size-14" },
    },
    defaultVariants: { variant: "muted", size: 48 },
  },
);

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonVariants> & { icon: IconName; label: string; iconSize?: number; asChild?: boolean };

export function IconButton({ icon, label, iconSize, variant, size, className, asChild, children, ...props }: IconButtonProps) {
  const Comp = asChild ? Slot : "button";
  const s = iconSize ?? (size === 40 ? 20 : size === 44 ? 22 : 24);
  return (
    <Comp aria-label={label} title={label} className={cn(iconButtonVariants({ variant, size }), className)} {...(!asChild && { type: "button" })} {...props}>
      {asChild ? children : <Icon name={icon} size={s} />}
    </Comp>
  );
}
