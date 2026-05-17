"use client";

import type { DayInfo, DayState } from "@/lib/weekTimeline";
import { getDayStateLabel, getDayStateTone } from "@/lib/weekTimeline";

// ─────────────────────────────────────────────────────────────────────────
// COMPACT — 7 dots in a horizontal row (used by Dashboard)
// ─────────────────────────────────────────────────────────────────────────

export function WeekTimelineCompact({ days, validatedCount }: { days: DayInfo[]; validatedCount: number }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Ma semaine</p>
        <p className="text-[11px] font-bold text-white/45">
          {validatedCount} séance{validatedCount > 1 ? "s" : ""} validée{validatedCount > 1 ? "s" : ""}
        </p>
      </div>

      <ol className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <li key={day.weekday}>
            <CompactDay day={day} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function CompactDay({ day }: { day: DayInfo }) {
  const tone = getDayStateTone(day.state);
  const symbol = getCompactSymbol(day);

  return (
    <div className="flex flex-col items-center gap-1">
      <p
        className={`text-[9px] font-black uppercase ${
          day.isToday ? "text-coral" : "text-white/40"
        }`}
      >
        {day.short}
      </p>
      <div
        aria-label={`${day.label} · ${getDayStateLabel(day.state)}`}
        className={`flex size-10 items-center justify-center rounded-xl border text-sm font-black ${tone.dotBg} ${
          day.isToday ? "ring-2 ring-coral/50" : ""
        }`}
        title={day.planned ? `${day.planned.title} — ${getDayStateLabel(day.state)}` : getDayStateLabel(day.state)}
      >
        {symbol}
      </div>
    </div>
  );
}

function getCompactSymbol(day: DayInfo): string {
  switch (day.state) {
    case "done":         return "✓";
    case "in-progress":  return "•";
    case "to-do":        return day.short;
    case "missed":       return "·";
    case "rest":         return "—";
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SHARED — small status badge (used by detailed timeline)
// ─────────────────────────────────────────────────────────────────────────

export function DayStatusBadge({ state }: { state: DayState }) {
  const tone = getDayStateTone(state);
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${tone.badge}`}>
      {getDayStateLabel(state)}
    </span>
  );
}
