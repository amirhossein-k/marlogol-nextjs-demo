export const flowerPacks = [
  { id: "chrysanthemum", name: "داوودی سفید", minStems: 4, maxStems: 5, price: 320000, stock: 8, color: "#f4ead4", kind: "daisy", note: "۴ تا ۵ شاخه در هر بسته" },
  { id: "rose", name: "رز قرمز", minStems: 15, maxStems: 15, price: 1250000, stock: 6, color: "#ad3855", kind: "rose", note: "۱۵ شاخه در هر بسته" },
  { id: "pinkrose", name: "رز صورتی", minStems: 15, maxStems: 15, price: 1350000, stock: 5, color: "#d486a2", kind: "rose", note: "۱۵ شاخه در هر بسته" },
  { id: "sunflower", name: "آفتابگردان", minStems: 5, maxStems: 5, price: 450000, stock: 4, color: "#d9a42c", kind: "sun", note: "۵ شاخه در هر بسته، نمونه" },
  { id: "tulip", name: "لاله سفید", minStems: 10, maxStems: 10, price: 650000, stock: 0, color: "#f2eddd", kind: "tulip", note: "۱۰ شاخه در هر بسته، نمونه" }
];
export const wrappings = [
  { id: "pistachio", name: "کاغذ پسته‌ای", price: 120000, color: "#bbcbae" },
  { id: "blush", name: "کاغذ صورتی", price: 150000, color: "#eac4d1" },
  { id: "kraft", name: "کاغذ کرافت", price: 90000, color: "#c3a07a" }
];
export const arrangements = ["آزاد و باغی", "گرد و کلاسیک", "بلند و مینیمال"];
export const ARRANGING_FEE = 200000;
export function calculateBouquet(quantities, packs, wrappingId) {
  const wrapping = wrappings.find(w => w.id === wrappingId) || wrappings[0];
  const selected = packs.filter(p => Number.isSafeInteger(quantities[p.id]) && quantities[p.id] > 0).map(p => ({ ...p, qty: quantities[p.id] }));
  return {
    selected, wrapping,
    flowersPrice: selected.reduce((n, p) => n + p.price * p.qty, 0),
    minStems: selected.reduce((n, p) => n + p.minStems * p.qty, 0),
    maxStems: selected.reduce((n, p) => n + p.maxStems * p.qty, 0),
    packCount: selected.reduce((n, p) => n + p.qty, 0),
    price: selected.length ? selected.reduce((n, p) => n + p.price * p.qty, 0) + wrapping.price + ARRANGING_FEE : 0
  };
}
export function packUsage(cart, packId) {
  return cart.reduce((sum, item) => sum + (item.custom?.packs || []).reduce((n, pack) => n + (pack.id === packId ? pack.qty * item.qty : 0), 0), 0);
}
export function customAvailable(custom, quantity, cart, packs, excludeId) {
  if (!custom?.packs?.length || !Number.isSafeInteger(quantity) || quantity < 1) return false;
  return custom.packs.every(component => {
    const pack = packs.find(p => p.id === component.id);
    return pack && Number.isSafeInteger(component.qty) && component.qty > 0 &&
      component.qty * quantity + packUsage(cart.filter(item => item.id !== excludeId), pack.id) <= pack.stock;
  });
}
