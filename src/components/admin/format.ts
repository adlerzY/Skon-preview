export const faDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString("fa-IR") : "—");

export const faDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("fa-IR") : "—");

export const faNumber = (value?: number | null) => Number(value ?? 0).toLocaleString("fa-IR");

export function faPrice(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "disabled") return "—";
  const number = Number(raw);
  return Number.isFinite(number) ? `${number.toLocaleString("fa-IR")} تومان` : "—";
}