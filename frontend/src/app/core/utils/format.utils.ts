/**
 * Indian-format currency helpers.
 * `en-IN` grouping gives lakh/crore separators (₹2,45,800) without a dependency.
 */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const inrPaiseFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹2,45,800 */
export function formatINR(amount: number): string {
  return `₹${inrFormatter.format(amount)}`;
}

/** ₹2,45,800.00 — for bill breakdowns where paise matter. */
export function formatINRDecimal(amount: number): string {
  return `₹${inrPaiseFormatter.format(amount)}`;
}

/**
 * Compact lakh/crore form used on dashboard tiles: ₹18.5L, ₹1.25Cr.
 * Falls back to full grouping below one lakh.
 */
export function formatINRShort(amount: number): string {
  const abs = Math.abs(amount);

  if (abs >= 1_00_00_000) {
    return `₹${trimZero(amount / 1_00_00_000)}Cr`;
  }
  if (abs >= 1_00_000) {
    return `₹${trimZero(amount / 1_00_000)}L`;
  }
  if (abs >= 1_000) {
    return `₹${trimZero(amount / 1_000)}K`;
  }
  return formatINR(amount);
}

/** 18.5 -> "18.5", 45.0 -> "45" */
function trimZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

/* ---------------- Dates ---------------- */

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dayMonthFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

/** 11:30 AM */
export function formatTime(value: string | Date): string {
  return timeFormatter.format(new Date(value));
}

/** Feb 5, 2025 */
export function formatShortDate(value: string | Date): string {
  return shortDateFormatter.format(new Date(value));
}

/** Feb 5 — compact form for card subtitles. */
export function formatDayMonth(value: string | Date): string {
  return dayMonthFormatter.format(new Date(value));
}

/**
 * "3d ago" style age, used on the NOC list and recent-actions feeds.
 * Falls back to the date once it is older than a week.
 */
export function formatTimeAgo(value: string | Date): string {
  const elapsedMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(elapsedMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDayMonth(value);
}
