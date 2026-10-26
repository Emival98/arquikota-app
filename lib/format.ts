const MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const MONTHS_LONG = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function fmtInt(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function fmtDateShort(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return "—";
  return `${pad(date.getUTCDate())} ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

export function fmtDate(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return "—";
  return `${date.getUTCDate()} ${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function fmtDateTimeUtc(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return "—";
  return `${fmtDateShort(iso)} ${date.getUTCFullYear()} · ${pad(date.getUTCHours())}:${pad(
    date.getUTCMinutes(),
  )} UTC`;
}
