export const productCategories = ["دسته‌گل", "باکس گل", "جار گل"];
export const productPhotos = ["hero", "roses", "box", "tulips", "sunflower"];
export function validateProduct(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("اطلاعات محصول معتبر نیست.");
  const text = (key, max, min = 0) => {
    if (typeof input[key] !== "string" || input[key].trim().length < min || input[key].trim().length > max) throw new Error(`فیلد ${key} معتبر نیست.`);
    return input[key].trim();
  };
  const name = text("name", 100, 2);
  const slug = text("slug", 80, 2);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("نشانی محصول باید انگلیسی، عدد و خط تیره باشد.");
  if (!productCategories.includes(input.category)) throw new Error("دسته‌بندی معتبر نیست.");
  if (!productPhotos.includes(input.photo)) throw new Error("تصویر معتبر نیست.");
  if (!Number.isSafeInteger(input.price) || input.price < 1000 || input.price > 1000000000) throw new Error("قیمت باید عدد صحیح بین ۱۰۰۰ و یک میلیارد تومان باشد.");
  if (!Number.isSafeInteger(input.stock) || input.stock < 0 || input.stock > 10000) throw new Error("موجودی باید عدد صحیح بین صفر و ۱۰ هزار باشد.");
  return { name, slug, category: input.category, photo: input.photo, price: input.price, stock: input.stock, label: text("label", 40), description: text("description", 2000, 10) };
}
