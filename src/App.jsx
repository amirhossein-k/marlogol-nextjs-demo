// Marlogol: Persian flower atelier for Tehran gift buyers. Separate catalog and custom bouquet studio.
// Builder signature: botanical specimen drawings, packaged stem counts, wrapping-paper live recipe.
// Design: nested wrapping-paper composition. Botanical ink #245b43, celadon #e7eddf,
// rose #ebc5d2, paper #f8faf5, graphite #253d30. Vazirmatn for Persian, Georgia for Latin.
// Signature: a green editorial garden with a ribbon-like delivery tag, not a generic storefront.
// Version 3: custom product editor; packaged Next.js adds local-only MongoDB persistence.
// Identity, payments, SMS and orders are explicitly simulated. No personal information is collected.
"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowUpLeft, ArrowLeft, ShoppingBag, Search, Flower2, Leaf, MapPin, Truck, Heart, Plus, Minus, Check, CalendarDays, Package, LayoutDashboard, MessageSquare, X, CheckCircle2, Clock, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Button } from "./ui/button";
import { toast, Toaster } from "sonner";
import hero from "./assets/hero.webp";
import roses from "./assets/roses.webp";
import box from "./assets/box.webp";
import tulips from "./assets/tulips.webp";
import sunflower from "./assets/sunflower.webp";
import { deliveryDates, cutoff, canCancel, formatDay, money } from "./rules.mjs";
import sampleProducts from "./data/products.json";
import BouquetBuilder, { CompositionDetails, FlowerDrawing } from "./BouquetBuilder";
import { flowerPacks, customAvailable, packUsage } from "./bouquet.mjs";
import ProductEditor from "./ProductEditor";
import ProductRails from "./ProductRails";
import { validateProduct } from "./product-validation.mjs";
import "./style.css";
import "./builder.css";
import "./editor.css";

const photos = Object.fromEntries(Object.entries({ hero, roses, box, tulips, sunflower }).map(([key, image]) => [key, typeof image === "string" ? image : image.src]));
export const initialProducts = sampleProducts;
const categories = ["همه گل‌ها", "دسته‌گل", "باکس گل", "جار گل"];
const statuses = { paid: "ثبت و پرداخت شده", preparing: "در حال آماده‌سازی", ready: "آماده ارسال", delivered: "تحویل داده شد", cancelled: "لغو شده" };
const slots = ["۱۰ تا ۱۴", "۱۴ تا ۱۸", "۱۸ تا ۲۱"];
function Modal({ open, close, title, description, children }) {
  return <Dialog open={open} onOpenChange={value => !value && close()}><DialogContent dir="rtl" className="marlo-modal"><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription>{children}</DialogContent></Dialog>;
}
function ProductPhoto({ product, ...props }) {
  if (product.custom) return <Flower2 className="custom-product-icon" aria-label="دسته‌گل سفارشی، بدون تصویر واقعی" {...props}/>;
  return <img src={photos[product.photo] || photos.hero} alt={product.name} loading="lazy" {...props} />;
}
function CartCompositionList({ items }) {
  return items.filter(item => item.custom).map(item => <CompositionDetails key={item.id} custom={item.custom}/>);
}
export default function App({ catalog = initialProducts, initialScreen = "shop", routingMode = "hash", backend = false, backendStatus = null }) {
  const [products, setProducts] = useState(catalog);
  const [category, setCategory] = useState("همه گل‌ها");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [screen, setScreen] = useState(initialScreen);
  const [packs, setPacks] = useState(flowerPacks);
  const [adminTab, setAdminTab] = useState("orders");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [signedIn, setSignedIn] = useState(false);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(slots[0]);
  const [city, setCity] = useState("تهران");
  const [occasion, setOccasion] = useState("با عشق");
  const [readyOrder, setReadyOrder] = useState(null);
  const [eta, setEta] = useState(slots[0]);
  const [cancelId, setCancelId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [connection, setConnection] = useState(backendStatus);
  const [busy, setBusy] = useState(false);
  const purchaseKey = useRef(null);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(null);
  useEffect(() => { purchaseKey.current = null; }, [cart, date, slot, city, occasion]);
  useEffect(() => {
    function route() {
      const routes = { "/": "shop", "/products": "products", "/build-bouquet": "builder", "/orders": "orders", "/admin": "admin" };
      const key = routingMode === "path" ? window.location.pathname : window.location.hash.replace(/^#/, "") || "/";
      setScreen(routes[key] || initialScreen);
    }
    route();
    window.addEventListener("popstate", route);
    window.addEventListener("hashchange", route);
    return () => { window.removeEventListener("popstate", route); window.removeEventListener("hashchange", route); };
  }, [routingMode, initialScreen]);
  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 30000);
    try {
      const saved = JSON.parse(localStorage.getItem("marlogol-demo-v1") || "null");
      if (saved) {
        if (Array.isArray(saved.cart)) setCart(saved.cart);
        if (!backend && Array.isArray(saved.orders)) setOrders(saved.orders);
        if (!backend && Array.isArray(saved.messages)) setMessages(saved.messages);
        if (Array.isArray(saved.favorites)) setFavorites(saved.favorites);
        if (!backend && Array.isArray(saved.products)) setProducts(saved.products);
        if (!backend && Array.isArray(saved.packs) && saved.packs.length) setPacks(saved.packs);
      }
    } catch { /* Corrupt or disabled storage falls back to sample data. */ }
    setHydrated(true);
    if (backend) refreshBackend().catch(err => { setConnection({ connected: false, writable: false }); toast.error(err.message); });
    return () => clearInterval(tick);
  }, [backend]);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("marlogol-demo-v1", JSON.stringify(backend ? { cart, favorites } : { cart, orders, products, favorites, messages, packs })); }
    catch { /* Demo remains usable without persistence. */ }
  }, [cart, orders, products, favorites, messages, packs, hydrated, backend]);
  async function api(path, method = "GET", body) {
    if (!backend) throw new Error("این پیش‌نمایش بک‌اند شبکه ندارد.");
    const response = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : {}, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "ذخیره انجام نشد.");
    return data;
  }
  async function refreshBackend() {
    const data = await api("/api/admin/bootstrap");
    setConnection(data.status);
    if (data.products) setProducts(data.products);
    if (data.packs) setPacks(data.packs);
    if (data.orders) setOrders(data.orders);
    if (data.messages) setMessages(data.messages);
  }
  async function saveProduct(data) {
    const checked = validateProduct(data);
    if (products.some(p => p.slug === checked.slug && p.id !== editingProduct?.id)) throw new Error("این نشانی قبلاً استفاده شده است.");
    if (backend) {
      await api(editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products", editingProduct ? "PUT" : "POST", { ...checked, ...(editingProduct ? { revision: editingProduct.revision } : {}) });
      await refreshBackend();
    } else {
      setProducts(list => editingProduct ? list.map(p => p.id === editingProduct.id ? { ...p, ...checked } : p) : [...list, { ...checked, id: "product-" + crypto.randomUUID() }]);
    }
    setModal(null); setEditingProduct(null); toast.success("محصول ذخیره شد.");
  }
  async function toggleProduct(product) {
    try {
      if (backend) {
        await api(`/api/admin/products/${product.id}`, "PUT", { ...product, stock: product.stock ? 0 : 5, revision: product.revision });
        await refreshBackend();
      } else setProducts(list => list.map(p => p.id === product.id ? { ...p, stock: p.stock ? 0 : 5 } : p));
      toast.success("موجودی محصول تغییر کرد.");
    } catch (err) { toast.error(err.message); }
  }
  async function adjustPack(pack, diff) {
    try {
      if (backend) {
        await api(`/api/admin/packs/${pack.id}`, "PATCH", { stock: Math.max(0, pack.stock + diff), revision: pack.revision });
        await refreshBackend();
      } else setPacks(list => list.map(p => p.id === pack.id ? { ...p, stock: Math.max(0, p.stock + diff) } : p));
    } catch (err) { toast.error(err.message); }
  }
  const dates = now ? deliveryDates(now) : [];
  const chosenDate = dates.includes(date) ? date : dates[0];
  const items = cart.map(item => ({ ...item, product: item.custom ? { id: item.id, name: "دسته‌گل دلخواه شما", photo: "hero", price: item.price, stock: 99, custom: item.custom } : products.find(p => p.id === item.id) })).filter(item => item.product);
  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shipping = total >= 3000000 ? 0 : 150000;
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const filtered = products.filter(p => p.stock > 0 && (category === "همه گل‌ها" || (category === "favorites" ? favorites.includes(p.id) : p.category === category)) && p.name.includes(search));
  function navigate(where) {
    const path = { shop: "/", products: "/products", builder: "/build-bouquet", orders: "/orders", admin: "/admin" }[where] || "/";
    window.history.pushState({}, "", routingMode === "path" ? path : "#" + path);
    setScreen(where); setModal(null); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function addCustom(custom, price) {
    if (!customAvailable(custom, 1, cart, packs)) return toast.error("موجودی بسته‌های انتخابی کافی نیست.");
    setCart(list => [...list, { id: "custom-" + crypto.randomUUID(), custom, price, qty: 1 }]);
    toast.success("دسته‌گل دلخواه با جزئیات چیدمان به سبد اضافه شد.");
  }
  function add(product) {
    const current = cart.find(p => p.id === product.id)?.qty || 0;
    if (current >= product.stock) return toast.error("موجودی نمونه این محصول کافی نیست.");
    setCart(list => current ? list.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p) : [...list, { id: product.id, qty: 1 }]);
    toast.success("به سبد گل‌ها اضافه شد.");
  }
  function changeQty(id, difference) {
    const item = cart.find(p => p.id === id);
    if (item?.custom) {
      const nextQty = item.qty + difference;
      if (nextQty <= 0) { setCart(list => list.filter(p => p.id !== id)); return; }
      if (!customAvailable(item.custom, nextQty, cart, packs, id)) return toast.error("برای این تعداد دسته‌گل، بسته کافی موجود نیست.");
      setCart(list => list.map(p => p.id === id ? { ...p, qty: nextQty } : p)); return;
    }
    const product = products.find(p => p.id === id);
    setCart(list => list.map(p => p.id === id ? { ...p, qty: Math.min(product.stock, p.qty + difference) } : p).filter(p => p.qty > 0));
  }
  function favorite(id) { setFavorites(list => list.includes(id) ? list.filter(p => p !== id) : [...list, id]); }
  function simulateLogin() { setSignedIn(true); setModal(null); toast.success("ورود نمونه انجام شد؛ هیچ کدی ارسال نشد."); }
  async function checkout() {
    if (busy) return;
    if (!signedIn) { setModal("login"); return; }
    if (!items.length) return;
    if (city !== "تهران") return toast.error("مارلوگل فقط در شهر تهران سفارش می‌پذیرد.");
    if (!deliveryDates(new Date()).includes(chosenDate)) return toast.error("روز تحویل تغییر کرده است. دوباره انتخاب کنید.");
    if (items.some(item => item.custom ? !customAvailable(item.custom, item.qty, cart, packs, item.id) : item.qty > item.product.stock)) return toast.error("موجودی محصول یا بسته گل تغییر کرده است.");
    if (backend) {
      setBusy(true);
      try {
        purchaseKey.current ||= crypto.randomUUID();
        await api("/api/demo/orders", "POST", { items: cart, deliveryDate: chosenDate, slot, occasion, city, requestId: purchaseKey.current });
        await refreshBackend(); setCart([]); navigate("orders"); toast.success("سفارش نمونه در MongoDB ثبت شد؛ پرداخت واقعی نبود.");
      } catch (err) { toast.error(err.message); }
      finally { setBusy(false); }
      return;
    }
    const id = "MG-" + Date.now().toString(36).toUpperCase();
    const order = { id, items: items.map(({ product, qty, custom }) => ({ name: product.name, photo: product.photo, price: product.price, qty, ...(custom ? { custom } : {}) })), deliveryDate: chosenDate, slot, occasion, city, total: total + shipping, status: "paid", createdAt: new Date().toISOString() };
    setPacks(list => list.map(p => ({ ...p, stock: p.stock - packUsage(cart, p.id) })));
    setOrders(list => [order, ...list]);
    setMessages(list => [{ id: crypto.randomUUID(), orderId: id, type: "خرید", text: `مشتری نمونه، سفارش ${id} ثبت شد. تحویل ${formatDay(chosenDate)}، بازه ${slot}.`, at: new Date().toISOString() }, ...list]);
    setCart([]); navigate("orders");
    toast.success("پرداخت و پیامک خرید شبیه‌سازی شد. پولی پرداخت نشد.");
  }
  async function cancel() {
    const order = orders.find(o => o.id === cancelId);
    if (!order || !canCancel(order, new Date())) { toast.error("مهلت لغو این سفارش گذشته است."); setCancelId(null); return; }
    if (backend) {
      try { await api(`/api/demo/orders/${order.id}`, "PATCH", { action: "cancel" }); await refreshBackend(); setCancelId(null); toast.success("لغو نمونه در MongoDB ثبت شد."); }
      catch (err) { toast.error(err.message); }
      return;
    }
    setOrders(list => list.map(o => o.id === cancelId ? { ...o, status: "cancelled", refund: "نیازمند بررسی بازپرداخت (نمایشی)" } : o));
    setPacks(list => list.map(p => ({ ...p, stock: p.stock + packUsage(order.items, p.id) })));
    setMessages(list => [{ id: crypto.randomUUID(), orderId: cancelId, type: "لغو", text: `سفارش ${cancelId} لغو شد. بازپرداخت صرفاً نمایشی و در انتظار بررسی است.`, at: new Date().toISOString() }, ...list]);
    setCancelId(null); toast.success("لغو نمونه ثبت شد؛ بازپرداخت واقعی انجام نمی‌شود.");
  }
  async function markReady() {
    const order = orders.find(o => o.id === readyOrder);
    if (!order || !["paid", "preparing"].includes(order.status)) return;
    if (backend) {
      try { await api(`/api/demo/orders/${order.id}`, "PATCH", { action: "ready", eta }); await refreshBackend(); setReadyOrder(null); toast.success("وضعیت و پیش‌نمایش پیامک در دیتابیس ذخیره شدند."); }
      catch (err) { toast.error(err.message); }
      return;
    }
    setOrders(list => list.map(o => o.id === readyOrder ? { ...o, status: "ready", eta } : o));
    setMessages(list => [{ id: crypto.randomUUID(), orderId: readyOrder, type: "آماده ارسال", text: `سفارش ${readyOrder} آماده شد. زمان تقریبی دریافت: ${formatDay(order.deliveryDate)}، ساعت ${eta}.`, at: new Date().toISOString() }, ...list]);
    setReadyOrder(null); toast.success("وضعیت تغییر کرد و پیش‌نمایش پیامک ایجاد شد؛ پیامکی ارسال نشد.");
  }
  async function transitionOrder(order, action) {
    if (backend) {
      try { await api(`/api/demo/orders/${order.id}`, "PATCH", { action }); await refreshBackend(); }
      catch (err) { toast.error(err.message); }
    } else setOrders(list => list.map(o => o.id === order.id ? { ...o, status: action === "prepare" ? "preparing" : "delivered" } : o));
  }
  function browse(value = "همه گل‌ها") { setCategory(value); navigate("products"); }
  return <div className="marlogol" dir="rtl">
    <Toaster position="bottom-center" richColors dir="rtl" />
    <div className="announcement"><span><Flower2 size={16} /> یک روز برای ساختن، یک لحظه برای خوشحال‌کردن</span><span>ارسال فقط در تهران <span className="dot">•</span> از فردا تا ۷ روز آینده</span></div>
    <header className="site-header">
      <button className="wordmark" onClick={() => navigate("shop")} aria-label="مارلوگل، خانه"><Flower2 /><span>مارلوگل<small>MARLO · FLOWER ATELIER</small></span></button>
      <nav aria-label="منوی اصلی"><button className={screen === "shop" ? "active" : ""} onClick={() => navigate("shop")}>خانه</button><button className={screen === "products" ? "active" : ""} onClick={() => browse()}>گل‌های مارلو</button><button className={screen === "builder" ? "active" : ""} onClick={() => navigate("builder")}>دسته‌گل دلخواه</button><button onClick={() => navigate("orders")}>پیگیری سفارش</button></nav>
      <div className="header-actions"><button aria-label="علاقه‌مندی‌ها" className="icon-button" onClick={() => browse("favorites")}><Heart size={20} /></button><button className="login-link" onClick={() => signedIn ? navigate("orders") : setModal("login")}>{signedIn ? "حساب نمونه" : "ورود / ثبت‌نام"}</button><button className="bag-button" aria-label="سبد خرید" onClick={() => setModal("cart")}><ShoppingBag size={19}/><span>{money(count)}</span></button></div>
    </header>
    <div className="demo-bar"><span>نسخه نمایشی · بدون پرداخت، پیامک یا دریافت اطلاعات شخصی</span><button onClick={() => navigate(screen === "admin" ? "shop" : "admin")}><LayoutDashboard size={15}/>{screen === "admin" ? "بازگشت به فروشگاه" : "دیدن داشبورد مدیریت"}<ArrowUpLeft size={15}/></button></div>
    {screen === "shop" && <main>
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="small-line"/> گل‌هایی برای حرف‌های نگفته</div><h1>کمی گل،<br/>یک دنیا <span>حالِ خوب.</span></h1><p>دسته‌گلی که با سلیقه چیده می‌شود،<br/>با عشق بسته‌بندی و در تهران به دست عزیزتان می‌رسد.</p><div className="hero-cta"><Button onClick={() => browse()}>یک بغل گل انتخاب کن <ArrowUpLeft /></Button><button className="text-link" onClick={() => setModal("delivery")}>داستان تحویل گل <ArrowLeft size={17}/></button></div><div className="hero-proof"><div className="leaf-seal"><Leaf size={24}/></div><span>تازه، دست‌چین، برای شما<small>هر سفارش، یک چیدمان با حوصله</small></span></div></div><div className="hero-photo"><img src={photos.hero} alt="دسته‌گل باغ صورتی با رز باغی و روبان زرشکی، مارلوگل" loading="eager"/><div className="photo-caption"><span>THE PINK GARDEN</span><span>باغ صورتی، انتخاب مارلو</span></div><div className="delivery-tag"><Truck size={26}/><strong>فردا، در تهران</strong><span>یا روزی که شما انتخاب کنید</span></div></div></section>
      <div className="service-strip"><span><Flower2/> گل تازه و چیدمان دست‌ساز</span><span><CalendarDays/> انتخاب روز تحویل تا یک هفته</span><span><Package/> بسته‌بندی با دقت و سلیقه</span><span><MapPin/> فقط در شهر تهران</span></div>
      <ProductRails products={products} Photo={ProductPhoto} onOpen={product => { setSelected(product); setModal("product"); }} onAdd={add} onBrowse={browse} routingMode={routingMode}/>
      <section className="home-search-copy"><div><h2>خرید گل و دسته‌گل در تهران</h2><p>در مارلوگل می‌توانید دسته‌گل آماده، باکس یا جار گل انتخاب کنید. روز تحویل از فردا تا هفت روز آینده انتخاب می‌شود؛ ارسال همان‌روز و ارسال خارج از شهر تهران نداریم.</p>{routingMode === "path" ? <a href="/categories/bouquets">معرفی دسته‌گل‌های مارلو</a> : <button className="text-link" onClick={() => browse("دسته‌گل")}>دسته‌گل‌های مارلو <ArrowUpLeft size={17}/></button>}</div><div><h2>دسته‌گلی به سلیقه خودتان</h2><p>یک بسته داوودی با ۴ تا ۵ شاخه را با بسته رز ۱۵ شاخه‌ای ترکیب کنید و کاغذ، چیدمان و روبان را انتخاب کنید. این نسخه، خرید و قیمت‌ها را شبیه‌سازی می‌کند.</p>{routingMode === "path" ? <a href="/build-bouquet">ساخت دسته‌گل دلخواه</a> : <button className="text-link" onClick={() => navigate("builder")}>ساخت دسته‌گل دلخواه <ArrowUpLeft size={17}/></button>}</div></section>
      <section className="custom-invitation"><div><span className="eyebrow">MADE OF YOUR CHOICES</span><h2>یک بسته داوودی، یک بسته رز…<br/>یک دسته‌گل به سلیقه خودت.</h2><p>گل‌ها و تعداد بسته‌ها را تو انتخاب کن؛ چیدمانش با مارلو.</p><Button onClick={() => navigate("builder")}>دسته‌گل خودت را بساز <ArrowUpLeft/></Button></div><div className="invitation-art"><FlowerDrawing pack={flowerPacks[0]}/><Plus size={24}/><FlowerDrawing pack={flowerPacks[1]}/></div></section>
      <section className="ritual"><div className="ritual-title"><span className="eyebrow">READY OR MADE FOR YOU</span><h2>یک انتخاب آماده،<br/><span>یا ترکیبی فقط برای تو.</span></h2><button className="text-link" onClick={() => browse()}>دیدن همه محصولات <ArrowUpLeft size={19}/></button></div><div className="ritual-steps"><div><span className="step-number">۱</span><strong>گل مورد علاقه‌ات را پیدا کن</strong><p>در صفحه محصولات، دسته‌گل و باکس آماده ببین.</p></div><div><span className="step-number">۲</span><strong>اگر سلیقه‌ات خاص است، خودت بساز</strong><p>تعداد بسته‌ها، کاغذ و سبک چیدمان را انتخاب کن.</p></div><div><span className="step-number">۳</span><strong>یک روز برای خوشحالی</strong><p>از فردا تا ۷ روز آینده، فقط در تهران.</p></div></div></section>
    </main>}
    {screen === "products" && <main className="catalog-page"><div className="catalog-intro"><span className="eyebrow">THE MARLO COLLECTION</span><h1>گل‌های مارلو</h1><p>چیدمان‌های آماده برای حرف‌هایی از دل.</p><button className="text-link" onClick={() => navigate("builder")}>ترکیب خودت را می‌خواهی؟ دسته‌گل بساز <ArrowUpLeft size={18}/></button></div>
      <section className="collection" id="collection"><div className="section-heading"><div><div className="eyebrow">THE MARLO COLLECTION</div><h2>{category === "favorites" ? "گل‌های مورد علاقه‌ات" : "کدام گل، حرفِ دل شماست؟"}</h2></div><div className="search-box"><Search size={19}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="نام گل را جست‌وجو کن..." aria-label="جست‌وجوی گل"/></div></div><div className="collection-controls"><ToggleGroup type="single" value={category} onValueChange={v => v && setCategory(v)} aria-label="دسته‌بندی گل‌ها">{categories.map(c => <ToggleGroupItem key={c} value={c}>{c}</ToggleGroupItem>)}</ToggleGroup><span>{money(filtered.length)} چیدمان برای انتخاب</span></div>
        <div className="product-grid">{filtered.map(product => <article className="product-card" key={product.id}><div className="product-visual"><button className="product-image-button" onClick={() => { setSelected(product); setModal("product"); }} aria-label={`مشاهده ${product.name}`}><ProductPhoto product={product}/></button><span className="product-label">{product.label}</span><button className={`favorite ${favorites.includes(product.id) ? "is-favorite" : ""}`} aria-label={`علاقه‌مندی ${product.name}`} aria-pressed={favorites.includes(product.id)} onClick={() => favorite(product.id)}><Heart size={19}/></button></div><div className="product-info"><div><small>{product.category}</small><button className="product-name" onClick={() => { setSelected(product); setModal("product"); }}><h3>{product.name}</h3></button><p>{money(product.price)} <small>تومان</small></p></div><button className="add-circle" aria-label={`افزودن ${product.name}`} onClick={() => add(product)}><Plus size={21}/></button></div></article>)}</div>
        {!filtered.length && <div className="empty-state"><Flower2/><h3>گلی با این انتخاب پیدا نشد.</h3><Button variant="outline" onClick={() => { setCategory("همه گل‌ها"); setSearch(""); }}>دیدن همه گل‌ها</Button></div>}
      </section>
      <section className="ritual"><div className="ritual-title"><span className="eyebrow">A LITTLE THOUGHT, A LOT OF LOVE</span><h2>هدیه‌ات را امروز انتخاب کن.<br/><span>لبخندش را به ما بسپار.</span></h2><button className="text-link" onClick={() => setModal("delivery")}>همه چیز درباره ارسال <ArrowUpLeft size={19}/></button></div><div className="ritual-steps"><div><span className="step-number">۱</span><strong>گلی شبیه احساس تو</strong><p>چیدمان دلخواهت را انتخاب کن.</p></div><div><span className="step-number">۲</span><strong>یک روز برای خوشحالی</strong><p>فردا یا یکی از ۷ روز آینده.</p></div><div><span className="step-number">۳</span><strong>در مسیر یک لبخند</strong><p>زمان تقریبی دریافت با پیامک اعلام می‌شود.</p></div></div></section>
      <section className="faq"><div><span className="eyebrow">GOOD TO KNOW</span><h2>قبل از فرستادن یک بغل گل</h2><p>چند جواب کوتاه برای یک انتخاب راحت.</p></div><div>{[
        ["به کدام شهرها ارسال دارید؟", "مارلوگل فقط در محدوده شهر تهران سفارش می‌پذیرد؛ کرج و شهرهای اطراف پوشش داده نمی‌شوند."],
        ["چه روزی گل به دست گیرنده می‌رسد؟", "پیش‌فرض تحویل روز بعد از سفارش است. هنگام خرید می‌توانید یکی از روزهای فردا تا ۷ روز آینده را انتخاب کنید. ارسال همان‌روز نداریم."],
        ["تا چه زمانی می‌توانم سفارش را لغو کنم؟", "لغو تا ساعت ۲۲ شبِ روز قبل از تحویل، به وقت تهران، امکان‌پذیر است. پس از آن گزینه لغو غیرفعال می‌شود. لغو سفارش به معنی بازپرداخت فوری نیست."],
        ["چطور از آماده‌شدن سفارش مطلع می‌شوم؟", "در نسخه عملیاتی پس از خرید پیامک تأیید می‌آید و مدیر هنگام آماده‌شدن، زمان تقریبی دریافت را با پیامک اعلام می‌کند. این نسخه فقط پیش‌نمایش پیامک را نشان می‌دهد."]
      ].map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18}/></summary><p>{answer}</p></details>)}</div></section>
    </main>}
    {screen === "builder" && <BouquetBuilder packs={packs} cart={cart} onAdd={addCustom} onCart={() => setModal("cart")}/>}
    {screen === "orders" && <main className="workspace"><div className="workspace-heading"><div><span className="eyebrow">YOUR LITTLE MOMENTS</span><h1>سفارش‌های شما</h1><p>تمام مسیر یک هدیه، از انتخاب تا رسیدن.</p></div><Button variant="outline" onClick={() => browse()}>انتخاب گل تازه <Flower2/></Button></div>
      {!orders.length ? <div className="empty-state"><ShoppingBag size={44}/><h2>هنوز گلی در مسیر نیست.</h2><p>با یک خرید نمایشی، پیگیری سفارش را امتحان کن.</p><Button onClick={() => browse()}>دیدن گل‌ها <ArrowUpLeft/></Button></div> : <div className="order-grid">{orders.map(order => <article className="order-card" key={order.id}><div className="order-top"><strong dir="ltr">{order.id}</strong><span className={`status ${order.status}`}>{statuses[order.status]}</span></div><div className="order-items">{order.items.map((item, index) => <div key={index}><ProductPhoto product={item}/><span>{item.name}<small>{money(item.qty)} عدد · {money(item.price)} تومان</small></span></div>)}</div>{order.items.filter(i => i.custom).map((item, index) => <CompositionDetails custom={item.custom} key={index}/>)}<div className="order-detail"><span><CalendarDays size={17}/>{formatDay(order.deliveryDate)}</span><span><Clock size={17}/>{order.eta || order.slot}</span><span><MapPin size={17}/>تهران، نشانی نمونه</span></div><div className="order-bottom"><strong>{money(order.total)} تومان</strong>{order.status !== "cancelled" && <Button variant="outline" disabled={!now || !canCancel(order, now)} onClick={() => setCancelId(order.id)}>لغو سفارش</Button>}</div><p className="order-note">{order.status === "cancelled" ? order.refund : `مهلت لغو: ${new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium", timeStyle: "short" }).format(cutoff(order.deliveryDate))}`}</p><small className="sample-note">سفارش و پرداخت نمایشی هستند.</small></article>)}</div>}
      {messages.length > 0 && <section className="message-section"><h2><MessageSquare size={23}/> پیش‌نمایش پیامک‌ها</h2>{messages.map(message => <div className="message" key={message.id}><span>{message.type} · ارسال نشده</span><p>{message.text}</p></div>)}</section>}
    </main>}
    {screen === "admin" && <main className="admin-layout"><aside className="admin-sidebar"><Flower2 size={32}/><h2>استودیوی مارلو</h2><p>داشبورد مدیریت نمایشی</p><button className={adminTab === "orders" ? "selected" : ""} onClick={() => setAdminTab("orders")}><Package size={19}/>سفارش‌ها <span>{money(orders.length)}</span></button><button className={adminTab === "products" ? "selected" : ""} onClick={() => setAdminTab("products")}><Flower2 size={19}/>محصولات</button><button className={adminTab === "messages" ? "selected" : ""} onClick={() => setAdminTab("messages")}><MessageSquare size={19}/>پیامک‌ها</button><button onClick={() => navigate("shop")}><LogOut size={19}/>بازگشت به فروشگاه</button><div className="admin-note"><Leaf/><span>هر سفارش، یک فرصت<br/>برای ساختن حال خوب.</span></div></aside><div className="admin-main"><div className="workspace-heading"><div><span className="eyebrow">MARLO STUDIO / DEMO</span><h1>{adminTab === "orders" ? "گل‌هایی که در مسیرند" : adminTab === "products" ? "چیدمان‌های فروشگاه" : "صندوق پیام‌های نمونه"}</h1><p>{backend ? "محصولات، موجودی و سفارش‌های ساختگی از MongoDB محلی خوانده می‌شوند." : "پیش‌نمایش تعاملی؛ ذخیره فقط در مرورگر. بک‌اند MongoDB داخل ZIP است."}</p></div>{adminTab === "products" && <Button onClick={() => { setEditingProduct(null); setModal("addProduct"); }}><Plus/>محصول جدید</Button>}</div>
      <div className={`backend-callout ${backend && !connection?.connected ? "error" : ""}`}><strong>{backend ? connection?.connected ? "MongoDB متصل است" : "MongoDB در دسترس نیست" : "حالت پیش‌نمایش محلی"}</strong><p>{backend ? connection?.writable ? "نوشتن محلی فعال است. این پنل برای انتشار عمومی احراز هویت ندارد." : "نوشتن غیرفعال است؛ تنظیمات اتصال و LOCAL_DEMO_WRITES را بررسی کنید." : "محصول با نام، قیمت، موجودی و توضیحات دلخواه بساز یا ویرایش کن. برای ذخیره دیتابیس، پروژه ZIP را محلی اجرا کن."}</p>{backend && <Button variant="outline" onClick={() => refreshBackend().catch(err => toast.error(err.message))}>بررسی دوباره اتصال</Button>}</div>
      <div className="admin-summary"><div><small>فروش نمایشی پرداخت‌شده</small><strong>{money(orders.filter(o => o.status !== "cancelled").reduce((n, o) => n + o.total, 0))} <span>تومان</span></strong></div><div><small>در انتظار آماده‌سازی</small><strong>{money(orders.filter(o => ["paid", "preparing"].includes(o.status)).length)} <span>سفارش</span></strong></div><div><small>پیامک‌های پیش‌نمایش</small><strong>{money(messages.length)} <span>پیام، بدون ارسال</span></strong></div></div>
      {adminTab === "orders" && (orders.length ? <div className="admin-order-list">{orders.map(order => <article className="admin-order" key={order.id}><div><strong dir="ltr">{order.id}</strong><span className={`status ${order.status}`}>{statuses[order.status]}</span></div><h3>{order.items.map(i => `${i.name} (${money(i.qty)} عدد)`).join("، ")}</h3><p>مشتری نمونه · تهران · {formatDay(order.deliveryDate)} · {order.eta || order.slot}</p>{order.items.filter(i => i.custom).map((item, index) => <CompositionDetails custom={item.custom} key={index}/>)}<div className="admin-order-actions"><strong>{money(order.total)} تومان</strong>{order.status === "paid" && <Button variant="outline" onClick={() => transitionOrder(order, "prepare")}>شروع آماده‌سازی</Button>}{["paid", "preparing"].includes(order.status) && <Button onClick={() => { setReadyOrder(order.id); setEta(order.slot); }}>آماده ارسال + پیامک</Button>}{order.status === "ready" && <Button variant="outline" onClick={() => transitionOrder(order, "deliver")}>ثبت تحویل</Button>}</div></article>)}</div> : <div className="empty-state"><Package/><h3>سفارشی برای آماده‌کردن نداریم.</h3><p>در فروشگاه یک سفارش نمایشی بساز.</p><Button onClick={() => browse()}>رفتن به فروشگاه</Button></div>)}
      {adminTab === "products" && <div className="admin-product-list">{products.map(product => <article key={product.id}><ProductPhoto product={product}/><div><h3>{product.name}</h3><p>{product.category} · {money(product.price)} تومان</p></div><span>{money(product.stock)} عدد</span><div className="admin-save-actions"><Button variant="outline" onClick={() => { setEditingProduct(product); setModal("addProduct"); }}>ویرایش</Button><Button variant="outline" onClick={() => toggleProduct(product)}>{product.stock ? "ناموجود کردن" : "موجود کردن"}</Button></div></article>)}</div>}
      {adminTab === "products" && <section className="pack-admin"><h2>بسته‌های گل برای سفارش دلخواه</h2><p className="sample-note">موجودی بر حسب بسته است. پرداخت نمونه موجودی را کم و لغو مجاز آن را برمی‌گرداند.</p>{packs.map(pack => <div key={pack.id}><span><strong>{pack.name}</strong><small>{pack.note} · {money(pack.price)} تومان</small></span><div className="quantity"><button aria-label={`کم کردن موجودی ${pack.name}`} disabled={!pack.stock} onClick={() => adjustPack(pack, -1)}><Minus size={16}/></button><span>{money(pack.stock)} بسته</span><button aria-label={`زیاد کردن موجودی ${pack.name}`} onClick={() => adjustPack(pack, 1)}><Plus size={16}/></button></div></div>)}</section>}
      {adminTab === "messages" && <section className="message-section">{messages.length ? messages.map(message => <div className="message" key={message.id}><span>{message.type} · پیش‌نمایش sms.ir، ارسال نشده</span><p>{message.text}</p></div>) : <div className="empty-state"><MessageSquare/><h3>هنوز پیش‌نمایش پیامکی ساخته نشده.</h3></div>}</section>}
    </div></main>}
    <footer><div className="footer-brand"><Flower2 size={30}/><strong>مارلوگل</strong><p>برای حرف‌هایی که گل‌ها بهتر می‌گویند.</p></div><div><strong>با خیال روشن انتخاب کن</strong><button onClick={() => setModal("delivery")}>قوانین ارسال و لغو</button><button onClick={() => navigate("orders")}>پیگیری سفارش</button><button onClick={() => navigate("admin")}>داشبورد نمایشی</button></div><div className="trust-notes"><span><CheckCircle2/>زرین‌پال: پرداخت شبیه‌سازی‌شده</span><span><Leaf/>اینماد: جایگاه نشان، غیرفعال در دمو</span><small>نشان یا تأییدیه واقعی در این نسخه نمایش داده نمی‌شود.</small></div><div className="footer-bottom"><span>مارلوگل · فروشگاه مفهومی گل در تهران</span><span>طراحی مستقل، با الهام از تجربه خرید گل</span></div></footer>
    <Modal open={modal === "login"} close={() => setModal(null)} title="ورود نمایشی به مارلوگل" description="بدون شماره تلفن، کد واقعی یا ارتباط با پنل پیامک."><div className="login-illustration"><Flower2 size={54}/></div><p className="modal-copy">در نسخه عملیاتی ورود با کد یک‌بارمصرف sms.ir انجام می‌شود. اینجا یک حساب ساختگی از قبل آماده است.</p><div className="sample-profile"><CheckCircle2/> مشتری نمونه · کد نمونه تأییدشده</div><Button onClick={simulateLogin}>شبیه‌سازی ورود موفق <ArrowLeft/></Button></Modal>
    <Modal open={modal === "product" && !!selected} close={() => setModal(null)} title={selected?.name || "محصول"} description="عکس و قیمت نمونه؛ چیدمان واقعی ممکن است با فصل تغییر کند.">{selected && <><ProductPhoto product={selected} className="detail-photo"/><p className="modal-copy">{selected.description}</p><div className="detail-price"><strong>{money(selected.price)} تومان</strong><span><Truck size={16}/>تحویل از فردا، فقط تهران</span></div><Button onClick={() => add(selected)}>افزودن به سبد گل‌ها <Plus/></Button><Button variant="outline" onClick={() => setModal("cart")}>دیدن سبد خرید ({money(count)})</Button></>}</Modal>
    <Modal open={modal === "cart"} close={() => setModal(null)} title="سبد گل‌های شما" description="خرید کاملاً نمایشی است؛ اطلاعات گیرنده و پرداخت دریافت نمی‌شود.">{!items.length ? <div className="empty-state"><ShoppingBag/><h3>سبدت منتظر یک بغل گل است.</h3><Button onClick={() => { setModal(null); browse(); }}>انتخاب گل</Button></div> : <>
      <div className="cart-items">{items.map(({ product, qty }) => <div className="cart-item" key={product.id}><ProductPhoto product={product}/><div><strong>{product.name}</strong><small>{money(product.price)} تومان</small><div className="quantity"><button aria-label={`کاهش ${product.name}`} onClick={() => changeQty(product.id, -1)}><Minus size={16}/></button><span>{money(qty)}</span><button aria-label={`افزایش ${product.name}`} onClick={() => changeQty(product.id, 1)}><Plus size={16}/></button></div></div><button className="icon-button" aria-label={`حذف ${product.name}`} onClick={() => setCart(list => list.filter(p => p.id !== product.id))}><X size={17}/></button></div>)}</div>
      <CartCompositionList items={items}/>
      <div className="checkout-section"><h3><CalendarDays size={19}/> روز دریافت گل</h3><p>پیش‌فرض فرداست. تا ۷ روز آینده انتخاب کنید.</p><div className="date-options">{dates.map(day => <button key={day} className={chosenDate === day ? "selected" : ""} aria-pressed={chosenDate === day} onClick={() => setDate(day)}><small>{day === dates[0] ? "فردا" : new Intl.DateTimeFormat("fa-IR", { weekday: "short", timeZone: "Asia/Tehran" }).format(new Date(day + "T12:00:00+03:30"))}</small><strong>{new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short", timeZone: "Asia/Tehran" }).format(new Date(day + "T12:00:00+03:30"))}</strong></button>)}</div><h3>بازه ترجیحی تحویل</h3><ToggleGroup type="single" value={slot} onValueChange={v => v && setSlot(v)}>{slots.map(s => <ToggleGroupItem key={s} value={s}>{s}</ToggleGroupItem>)}</ToggleGroup><small className="sample-note">زمان تقریبی نهایی هنگام آماده‌شدن توسط مدیر اعلام می‌شود.</small><h3>شهر گیرنده نمونه</h3><ToggleGroup type="single" value={city} onValueChange={v => v && setCity(v)}><ToggleGroupItem value="تهران">تهران</ToggleGroupItem><ToggleGroupItem value="کرج">کرج (بدون پوشش)</ToggleGroupItem></ToggleGroup>{city !== "تهران" && <p className="error-note" role="alert">ارسال به کرج امکان‌پذیر نیست؛ تهران را انتخاب کنید.</p>}<div className="sample-profile"><MapPin size={18}/>گیرنده و نشانی از پیش تعیین‌شده: مشتری نمونه، تهران</div><h3>کارت همراه گل</h3><ToggleGroup type="single" value={occasion} onValueChange={v => v && setOccasion(v)}>{["با عشق", "تولدت مبارک", "به یاد تو"].map(s => <ToggleGroupItem key={s} value={s}>{s}</ToggleGroupItem>)}</ToggleGroup></div>
      <div className="cart-totals"><span>گل‌های انتخاب‌شده<strong>{money(total)} تومان</strong></span><span>ارسال نمونه<strong>{shipping ? money(shipping) + " تومان" : "رایگان"}</strong></span><small>ارسال رایگان از ۳ میلیون تومان (سیاست نمونه و قابل تغییر)</small><span className="grand-total">مبلغ نهایی<strong>{money(total + shipping)} تومان</strong></span></div><p className="sample-note">لغو تا ساعت ۲۲ شب قبل از تحویل به وقت تهران. هیچ مبلغی دریافت نمی‌شود.</p><Button disabled={city !== "تهران" || !chosenDate} onClick={checkout}>{signedIn ? "شبیه‌سازی پرداخت موفق زرین‌پال" : "ورود نمونه برای ادامه خرید"}<ArrowLeft/></Button></>}</Modal>
    <Modal open={modal === "delivery"} close={() => setModal(null)} title="با حوصله می‌چینیم، به‌موقع می‌رسانیم." description="قوانین تحویل و لغو مارلوگل"><div className="policy-row"><MapPin/><div><strong>فقط شهر تهران</strong><p>ارسال به کرج و شهرهای اطراف فعال نیست.</p></div></div><div className="policy-row"><CalendarDays/><div><strong>از فردا تا ۷ روز آینده</strong><p>در صورت انتخاب‌نکردن تاریخ، روز بعد از سفارش انتخاب می‌شود؛ تقویم به وقت تهران است.</p></div></div><div className="policy-row"><Clock/><div><strong>لغو تا ساعت ۲۲ شب قبل</strong><p>پس از این زمان سفارش قابل لغو نیست. بازپرداخت فرایندی جدا از لغو دارد.</p></div></div><div className="policy-row"><MessageSquare/><div><strong>خبر خوب با پیامک</strong><p>پس از خرید و هنگام آماده‌شدن سفارش اطلاع‌رسانی می‌شود. پیامک‌ها در دمو ارسال نمی‌شوند.</p></div></div></Modal>
    <Modal open={!!cancelId} close={() => setCancelId(null)} title="لغو این سفارش نمونه؟" description="گل‌ها از صف آماده‌سازی خارج می‌شوند. در این دمو پولی جابه‌جا نشده است."><Button onClick={cancel}>تأیید لغو نمایشی</Button><Button variant="outline" onClick={() => setCancelId(null)}>نگه‌داشتن سفارش</Button></Modal>
    <Modal open={!!readyOrder} close={() => setReadyOrder(null)} title="گل‌ها آماده‌اند" description="بازه تقریبی دریافت را تعیین کنید؛ فقط پیش‌نمایش پیامک ساخته می‌شود."><ToggleGroup type="single" value={eta} onValueChange={v => v && setEta(v)}>{slots.map(s => <ToggleGroupItem key={s} value={s}>{s}</ToggleGroupItem>)}</ToggleGroup><div className="message"><span>پیش‌نمایش sms.ir</span><p>سفارش {readyOrder} آماده شد. زمان تقریبی دریافت: {orders.find(o => o.id === readyOrder)?.deliveryDate ? formatDay(orders.find(o => o.id === readyOrder).deliveryDate) : ""}، ساعت {eta}.</p></div><Button onClick={markReady}>ثبت آمادگی و ساخت پیامک نمونه <Check/></Button></Modal>
    <Modal open={modal === "addProduct"} close={() => setModal(null)} title={editingProduct ? "ویرایش محصول" : "محصولی تازه برای مارلو"} description="نام، قیمت، موجودی و توضیحات دلخواه؛ تصویر از گالری نمونه انتخاب می‌شود."><ProductEditor key={editingProduct?.id || "new"} product={editingProduct} onSave={saveProduct} photos={photos} databaseMode={backend}/></Modal>
  </div>;
}
