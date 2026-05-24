import { assertNonEmpty, toTimestamp, type RuntimeTimestamp } from "../shared/types.js";

export type ScrollStation =
  | "isolde"
  | "foundry-rook"
  | "foundry-scribe"
  | "citadel-rook"
  | "citadel-scribe"
  | "citadel-core";

export type ScrollAction =
  | "packet-created"
  | "packet-forwarded"
  | "packet-received"
  | "packet-recorded"
  | "packet-reviewed"
  | "packet-returned"
  | "packet-repackaged";

export interface ScrollEntry {
  at: RuntimeTimestamp;
  station: ScrollStation;
  action: ScrollAction;
  summary: string;
}

export interface AuditScroll {
  scrollId: string;
  packetId: string;
  missionId: string | null;
  entries: ScrollEntry[];
  clockCursorMs: number;
}

export function createAuditScroll(packetId: string, missionId: string | null = null): AuditScroll {
  assertNonEmpty(packetId, "scroll.packetId");

  return {
    scrollId: `scroll-${packetId}`,
    packetId,
    missionId,
    entries: [],
    clockCursorMs: Date.now(),
  };
}

function nextScrollTimestamp(scroll: AuditScroll, action: ScrollAction): RuntimeTimestamp {
  const minimumAdvanceMs =
    action === "packet-reviewed" ? 650
    : action === "packet-repackaged" ? 420
    : action === "packet-returned" ? 260
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
