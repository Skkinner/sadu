import { Fragment } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Stop progress strip: ◆✓ —— ◆ —— ◇ —— ◇ —— ◇  (Figma D20 › Journey thread) */
export function JourneyThread({ current, total = 5, done }: { current: number; total?: number; done: (i: number) => boolean }) {
  return (
    <div className="flex items-center" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const isDone = done(i) && i !== current;
        const isCurrent = i === current;
        return (
          <Fragment key={i}>
            {i > 0 && <span className={cn("h-0.5 flex-1", done(i - 1) && i <= current ? "bg-action" : "bg-line")} />}
            <span className="grid size-[30px] shrink-0 place-items-center">
              <span
                className={cn(
                  "grid rotate-45 place-items-center rounded-[3px]",
                  isCurrent && "size-[21px] bg-gold",
                  isDone && "size-[18px] bg-action text-on-action",
                  !isCurrent && !isDone && "size-[12px] border-[1.5px] border-line-strong bg-card",
                )}
              >
                {isDone && <Icon name="check" size={12} className="-rotate-45" />}
              </span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
