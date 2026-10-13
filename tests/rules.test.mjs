import test from "node:test";
import assert from "node:assert/strict";
import { tehranDay, deliveryDates, cutoff, canCancel, addDay } from "../src/rules.mjs";
test("Tehran date crosses midnight independently of server timezone", () => {
  assert.equal(tehranDay(new Date("2026-10-13T20:29:59Z")), "2026-10-13");
  assert.equal(tehranDay(new Date("2026-10-13T20:30:00Z")), "2026-10-14");
});
test("exactly tomorrow through seven days ahead", () => {
  assert.deepEqual(deliveryDates(new Date("2026-10-13T11:00:00Z")), ["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20"]);
});
test("month, leap-year and year rollover", () => {
  assert.equal(addDay("2026-12-31", 1), "2027-01-01");
  assert.equal(addDay("2028-02-28", 1), "2028-02-29");
  assert.equal(addDay("2026-02-28", 1), "2026-03-01");
});
test("cancel before and at 22:00 previous day, not after", () => {
  const order = { deliveryDate: "2026-10-15", status: "paid" };
  assert.equal(cutoff(order.deliveryDate).toISOString(), "2026-10-14T18:30:00.000Z");
  assert.equal(canCancel(order, new Date("2026-10-14T18:29:59Z")), true);
  assert.equal(canCancel(order, new Date("2026-10-14T18:30:00Z")), true);
  assert.equal(canCancel(order, new Date("2026-10-14T18:30:00.001Z")), false);
});
test("delivered and cancelled orders never cancel again", () => {
  for (const status of ["delivered", "cancelled"]) assert.equal(canCancel({ deliveryDate: "2026-10-15", status }, new Date("2026-10-13T10:00:00Z")), false);
});
test("ready orders obey same time boundary", () => {
  assert.equal(canCancel({ deliveryDate: "2026-10-15", status: "ready" }, new Date("2026-10-14T18:00:00Z")), true);
});
