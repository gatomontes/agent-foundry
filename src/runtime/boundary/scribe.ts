import { assertNonEmpty, toTimestamp, type RuntimeTimestamp } from "../shared/types.js";

export type ScrollStation =
  | "isolde"
  | "foundry-rook"
  | "foundry-scribe"
  | "citadel-rook"
  | "citadel-scribe"
  | "citadel-notary"
  | "citadel-core";

export type ScrollAction =
  | "scroll-created"
  | "scroll-forwarded"
  | "scroll-received"
  | "scroll-recorded"
  | "scroll-reviewed"
  | "scroll-notarized"
  | "scroll-returned"
  | "scroll-repackaged";

export interface ScrollEntry {
  at: RuntimeTimestamp;
  station: ScrollStation;
  action: ScrollAction;
  summary: string;
}

export interface AuditScroll {
  scrollId: string;
  attachedScrollId: string;
  missionId: string | null;
  entries: ScrollEntry[];
  clockCursorMs: number;
}

export function createAuditScroll(attachedScrollId: string, missionId: string | null = null): AuditScroll {
  assertNonEmpty(attachedScrollId, "scroll.attachedScrollId");

  return {
    scrollId: `scroll-${attachedScrollId}`,
    attachedScrollId,
    missionId,
    entries: [],
    clockCursorMs: Date.now(),
  };
}

function nextScrollTimestamp(scroll: AuditScroll, action: ScrollAction): RuntimeTimestamp {
  const minimumAdvanceMs =
    action === "scroll-reviewed" ? 650
    : action === "scroll-notarized" ? 500
    : action === "scroll-repackaged" ? 420
    : action === "scroll-returned" ? 260
    : 180;
  const now = Date.now();
  scroll.clockCursorMs = Math.max(scroll.clockCursorMs + minimumAdvanceMs, now);
  return toTimestamp(new Date(scroll.clockCursorMs));
}

export function recordScrollEntry(
  scroll: AuditScroll,
  station: ScrollStation,
  action: ScrollAction,
  summary: string,
): AuditScroll {
  assertNonEmpty(summary, "scrollEntry.summary");

  scroll.entries.push({
    at: nextScrollTimestamp(scroll, action),
    station,
    action,
    summary,
  });

  return scroll;
}

export class FoundryScribe {
  record(scroll: AuditScroll, action: ScrollAction, summary: string): AuditScroll {
    recordScrollEntry(scroll, "foundry-scribe", action, summary);
    return scroll;
  }
}

export class CitadelScribe {
  record(scroll: AuditScroll, action: ScrollAction, summary: string): AuditScroll {
    recordScrollEntry(scroll, "citadel-scribe", action, summary);
    return scroll;
  }
}
