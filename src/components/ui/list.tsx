import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

// Figma › Components › List Row (Trailing = Chevron / Toggle)
export function ListGroup({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-2.5", className)}>
      {title && <h2 className="t-label text-ink-2">{title}</h2>}
      <div className="divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-card">{children}</div>
    </section>
  );
}

type RowBase = { icon: IconName; title: ReactNode; description?: ReactNode };

function RowInner({ icon, title, description, trailing }: RowBase & { trailing: ReactNode }) {
  return (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-ink">
        <Icon name={icon} size={22} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
        <span className="t-body-strong text-ink">{title}</span>
        {description && <span className="t-caption text-ink-2">{description}</span>}
      </span>
      {trailing}
    </>
  );
}

const rowClass = "flex min-h-[71px] w-full items-center gap-3.5 bg-card px-4 py-3";

export function ListRowLink({ href, onClick, ...rest }: RowBase & { href?: string; onClick?: () => void }) {
  const trailing = <Icon name="chevron-right" size={22} className="text-ink-2" />;
  if (href) {
    return (
      <Link href={href} className={cn(rowClass, "transition-colors hover:bg-muted/60")}>
        <RowInner {...rest} trailing={trailing} />
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(rowClass, "transition-colors hover:bg-muted/60")}>
      <RowInner {...rest} trailing={trailing} />
    </button>
  );
}

export function ListRowToggle({ control, ...rest }: RowBase & { control: ReactNode }) {
  return (
    <div className={rowClass}>
      <RowInner {...rest} trailing={control} />
    </div>
  );
}
