import type { SVGProps } from "react";
import { iconPaths, type IconName } from "@/components/brand/icon-paths";
import { cn } from "@/lib/utils";

const DIRECTIONAL = new Set<IconName>(["arrow-left", "arrow-right", "chevron-left", "chevron-right", "skip-back", "logout"]);

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  size?: number;
  /** mirror arrows/chevrons in RTL (default true for directional icons) */
  directional?: boolean;
  label?: string;
};

export function Icon({ name, size = 24, directional, label, className, ...props }: IconProps) {
  const flip = directional ?? DIRECTIONAL.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("shrink-0", flip && "flip-rtl", className)}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

export type { IconName };
