export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export function parsePositiveInt(value: string | null | undefined): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseOptionalDateRange(searchParams: URLSearchParams): DateRange {
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  const fromDate = fromRaw ? new Date(fromRaw) : null;
  const toDate = toRaw ? new Date(toRaw) : null;

  return {
    from: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : null,
    to: toDate && !Number.isNaN(toDate.getTime()) ? toDate : null,
  };
}
