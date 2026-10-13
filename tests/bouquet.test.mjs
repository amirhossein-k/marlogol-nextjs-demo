import test from "node:test";
import assert from "node:assert/strict";
import { calculateBouquet, flowerPacks, customAvailable, packUsage } from "../src/bouquet.mjs";
test("one daisy pack and one rose pack: 19 to 20 stems, not two flowers", () => {
  const result = calculateBouquet({ chrysanthemum: 1, rose: 1 }, flowerPacks, "pistachio");
  assert.equal(result.minStems, 19); assert.equal(result.maxStems, 20);
  assert.equal(result.packCount, 2); assert.equal(result.price, 1890000);
});
test("zero selection does not charge wrapping or arranging", () => {
  assert.equal(calculateBouquet({}, flowerPacks, "blush").price, 0);
});
test("pack stock is shared across distinct compositions", () => {
  const custom = { packs: [{ id: "rose", qty: 4 }] };
  const cart = [{ id: "custom-a", qty: 1, custom }];
  assert.equal(packUsage(cart, "rose"), 4);
  assert.equal(customAvailable({ packs: [{ id: "rose", qty: 3 }] }, 1, cart, flowerPacks), false);
  assert.equal(customAvailable({ packs: [{ id: "rose", qty: 2 }] }, 1, cart, flowerPacks), true);
});
test("increasing one bouquet reserves all its components", () => {
  const custom = { packs: [{ id: "rose", qty: 4 }] };
  assert.equal(customAvailable(custom, 2, [{ id: "a", qty: 1, custom }], flowerPacks, "a"), false);
  assert.equal(customAvailable(custom, 1, [{ id: "a", qty: 1, custom }], flowerPacks, "a"), true);
});
test("unavailable flowers and invalid quantities cannot be checked out", () => {
  assert.equal(customAvailable({ packs: [{ id: "tulip", qty: 1 }] }, 1, [], flowerPacks), false);
  assert.equal(customAvailable({ packs: [{ id: "rose", qty: -1 }] }, 1, [], flowerPacks), false);
  assert.equal(customAvailable({ packs: [] }, 1, [], flowerPacks), false);
});
