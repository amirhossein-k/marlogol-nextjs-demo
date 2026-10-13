export const TIME_ZONE = "Asia/Tehran";
export function tehranDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (name) => parts.find(p => p.type === name).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function addDay(day, offset) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function deliveryDates(now = new Date()) {
  return Array.from({ length: 7 }, (_, index) => addDay(tehranDay(now), index + 1));
}
export function cutoff(deliveryDate) {
  // Tehran has no daylight saving time since 2023. Use explicit +03:30 for this demo.
  return new Date(`${addDay(deliveryDate, -1)}T22:00:00+03:30`);
}
export function canCancel(order, now = new Date()) {
  return ["paid", "preparing", "ready"].includes(order.status) && now.getTime() <= cutoff(order.deliveryDate).getTime();
}
export function formatDay(day) {
  return new Intl.DateTimeFormat("fa-IR", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" }).format(new Date(`${day}T12:00:00+03:30`));
}
export function money(value) { return new Intl.NumberFormat("fa-IR").format(value); }
