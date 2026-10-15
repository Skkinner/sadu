"use client";

import { CelebrateArt } from "@/components/brand/art";
import type { PavilionId } from "@/data/pavilions";
import { cn } from "@/lib/utils";
import { PassportStamp } from "./brand";

// Confetti diamonds from Figma D24/D56 › Celebration (390×330 frame)
const CONFETTI = [
  { x: 39, y: 60, s: 15, r: -5, c: "#E2A33A" },
  { x: 339, y: 50, s: 13, r: -5, c: "#0B6B57" },
  { x: 27, y: 250, s: 12, r: -15, c: "#A3232E" },
  { x: 350, y: 239, s: 15, r: 5, c: "#E2A33A" },
  { x: 88, y: 20, s: 10, r: -15, c: "#A3232E" },
  { x: 297, y: 300, s: 12, r: -15, c: "#0B6B57" },
  { x: 69, y: 170, s: 9, r: -5, c: "#14163A" },
  { x: 328, y: 150, s: 10, r: -15, c: "#A3232E" },
  { x: 200, y: 9, s: 11, r: 5, c: "#0B6B57" },
];

/** Bounding boxes of the five fanned stamps on the badge screen (D56), with rotation. */
const FAN: { id: PavilionId; x: number; y: number; w: number; h: number; r: number }[] = [
  { id: "saudi", x: 5, y: 150, w: 107, h: 123, r: -16 },
  { id: "japan", x: 82, y: 96, w: 96, h: 115, r: -8 },
  { id: "mexico", x: 236, y: 85, w: 96, h: 115, r: 8 },
  { id: "korea", x: 290, y: 127, w: 107, h: 123, r: 16 },
  { id: "morocco", x: 150, y: 200, w: 82, h: 104, r: 0 },
];

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function Celebration({ stamp, badge, className }: { stamp?: PavilionId; badge?: boolean; className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-[390/330] w-full max-w-[390px]", className)} aria-hidden>
      <span className="absolute rounded-full bg-gold-subtle" style={{ left: pct(55, 390), top: pct(25, 330), width: pct(280, 390), height: pct(280, 330) }} />
      {CONFETTI.map((d, i) => (
        <span
          key={i}
          className="absolute grid place-items-center motion-safe:animate-[sadu-pop-in_.5s_ease-out_both]"
          style={{ left: pct(d.x, 390), top: pct(d.y, 330), width: d.s, height: d.s, animationDelay: `${150 + i * 40}ms` }}
        >
          {/* rotation lives on the inner element so the pop-in animation can't override it */}
          <span
            className="rounded-[1px]"
            style={{
              width: d.s * 0.7,
              height: d.s * 0.7,
              background: d.c === "#14163A" ? "var(--text-primary)" : d.c,
              transform: `rotate(${45 + d.r}deg)`,
            }}
          />
        </span>
      ))}
      {stamp && (
        <span
          className="absolute grid place-items-center motion-safe:animate-[sadu-stamp_.6s_cubic-bezier(.2,.8,.2,1)_both]"
          style={{ left: pct(71, 390), top: pct(31, 330), width: pct(231, 390), height: pct(280, 330) }}
        >
          <PassportStamp id={stamp} width={205} className="-rotate-6 drop-shadow-lg max-w-[88%]" />
        </span>
      )}
      {badge && (
        <>
          {FAN.map((s, i) => (
            <span
              key={s.id}
              className="absolute grid place-items-center motion-safe:animate-[sadu-pop-in_.5s_ease-out_both]"
              style={{ left: pct(s.x, 390), top: pct(s.y, 330), width: pct(s.w, 390), height: pct(s.h, 330), animationDelay: `${i * 90}ms` }}
            >
              <PassportStamp id={s.id} width={s.w * 0.86} className="max-w-[90%] drop-shadow-md" style={{ transform: `rotate(${s.r}deg)` }} />
            </span>
          ))}
          <CelebrateArt
            className="absolute motion-safe:animate-[sadu-stamp_.7s_.45s_cubic-bezier(.2,.8,.2,1)_both]"
            style={{ left: pct(81, 390), top: pct(8, 330), width: pct(228, 390) }}
          />
        </>
      )}
    </div>
  );
}
