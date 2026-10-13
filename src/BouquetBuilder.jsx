"use client";
import React, { useState } from "react";
import { Flower2, Plus, Minus, ArrowLeft, Package, Check, Leaf } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Button } from "./ui/button";
import { money } from "./rules.mjs";
import { calculateBouquet, wrappings, arrangements, ARRANGING_FEE, packUsage } from "./bouquet.mjs";
export function FlowerDrawing({ pack, small = false }) {
  const petals = pack.kind === "daisy" ? 16 : pack.kind === "sun" ? 12 : 9;
  return <svg viewBox="0 0 180 180" role="img" aria-label={`تصویر شماتیک ${pack.name}`} className="flower-drawing">
    <path d="M90 158Q108 117 90 71" fill="none" stroke="#487e50" strokeWidth="4"/>
    <path d="M95 131Q61 136 56 107Q89 105 95 131M97 115Q127 111 136 85Q100 91 97 115" fill="#83a079"/>
    <g transform="translate(90 64)">
      {Array.from({ length: petals }, (_, i) => <ellipse key={i} cy={pack.kind === "rose" ? -17 : -24} rx={pack.kind === "rose" ? 18 : 9} ry={pack.kind === "rose" ? 25 : 30} fill={pack.color} stroke={pack.kind === "rose" ? "#9d4566" : "#b1a37b"} strokeWidth=".8" transform={`rotate(${i * 360 / petals})`}/>)}
      <circle r={pack.kind === "sun" ? 22 : pack.kind === "rose" ? 17 : 12} fill={pack.kind === "sun" ? "#6b4b30" : pack.kind === "rose" ? "#b04b70" : "#d6b45a"}/>
      {pack.kind === "rose" && <path d="M-8-4Q8-18 13 1Q-10 18-12 3Q-6-8 5 0" fill="none" stroke="#efc6d0" strokeWidth="2"/>}
    </g>
  </svg>;
}
export function CompositionDetails({ custom }) {
  if (!custom) return null;
  return <div className="composition-details"><strong>ترکیب برای گل‌آرا (برای هر دسته‌گل)</strong>{custom.packs.map(p => <span key={p.id}>{money(p.qty)} بسته {p.name} · هر بسته {p.minStems === p.maxStems ? money(p.minStems) : `${money(p.minStems)} تا ${money(p.maxStems)}`} شاخه</span>)}<span>{custom.wrapping.name} · چیدمان {custom.arrangement} · روبان {custom.ribbon}</span><small>جمع: {custom.minStems === custom.maxStems ? money(custom.minStems) : `${money(custom.minStems)} تا ${money(custom.maxStems)}`} شاخه. شکل نهایی با گل‌آراست؛ تصویر، شماتیک است.</small></div>;
}
export default function BouquetBuilder({ packs, cart, onAdd, onCart }) {
  const [quantities, setQuantities] = useState({});
  const [wrappingId, setWrappingId] = useState(wrappings[0].id);
  const [arrangement, setArrangement] = useState(arrangements[0]);
  const [ribbon, setRibbon] = useState("زرشکی");
  const summary = calculateBouquet(quantities, packs, wrappingId);
  const unavailable = summary.selected.some(p => p.qty + packUsage(cart, p.id) > p.stock);
  function change(pack, diff) {
    const available = Math.max(0, pack.stock - packUsage(cart, pack.id));
    setQuantities(previous => ({ ...previous, [pack.id]: Math.max(0, Math.min(available, (previous[pack.id] || 0) + diff)) }));
  }
  function add() {
    if (!summary.selected.length || unavailable) return;
    const custom = {
      packs: summary.selected.map(({ id, name, qty, minStems, maxStems, price }) => ({ id, name, qty, minStems, maxStems, price })),
      wrapping: summary.wrapping, arrangement, ribbon,
      minStems: summary.minStems, maxStems: summary.maxStems, arrangingFee: ARRANGING_FEE
    };
    onAdd(custom, summary.price);
  }
  return <main className="builder-page">
    <div className="builder-intro"><div><span className="eyebrow">YOUR FLOWERS, YOUR WAY</span><h1>این بار، گل‌آرا خودِ تویی.</h1><p>گل‌ها را بسته‌ای انتخاب کن؛ ما ترکیب دلخواهت را یک دسته‌گل می‌کنیم.</p></div><span className="builder-step-tag"><Flower2/>انتخاب گل · تزیین · یک بغل مخصوص تو</span></div>
    <div className="builder-layout"><div className="builder-choices">
      <section className="builder-section"><div className="builder-section-heading"><span>۱</span><div><h2>گل‌های دسته‌گلت را انتخاب کن</h2><p>تعداد انتخاب‌ها «بسته» است، نه شاخه. قیمت‌ها و موجودی‌ها نمونه‌اند.</p></div></div>
        <div className="flower-pack-grid">{packs.map(pack => {
          const remaining = Math.max(0, pack.stock - packUsage(cart, pack.id));
          return <article className={`flower-pack ${quantities[pack.id] ? "chosen" : ""}`} key={pack.id}><div className="pack-art"><FlowerDrawing pack={pack}/><span>{pack.stock ? `${money(remaining)} بسته قابل انتخاب` : "ناموجود"}</span>{!!quantities[pack.id] && <Check className="pack-check" size={20}/>}</div><div className="pack-info"><h3>{pack.name}</h3><p>{pack.note}</p><strong>{money(pack.price)} <small>تومان / بسته</small></strong><div className="pack-quantity"><button disabled={!quantities[pack.id]} onClick={() => change(pack, -1)} aria-label={`کاهش بسته ${pack.name}`}><Minus size={18}/></button><span><b>{money(quantities[pack.id] || 0)}</b> بسته</span><button disabled={!remaining || (quantities[pack.id] || 0) >= remaining} onClick={() => change(pack, 1)} aria-label={`افزودن بسته ${pack.name}`}><Plus size={18}/></button></div></div></article>;
        })}</div>
      </section>
      <section className="builder-section decoration-section"><div className="builder-section-heading"><span>۲</span><div><h2>به سلیقه خودت تمامش کن</h2><p>کاغذ، سبک چیدمان و رنگ روبان را انتخاب کن.</p></div></div><h3>کاغذ دور دسته‌گل</h3><ToggleGroup type="single" value={wrappingId} onValueChange={v => v && setWrappingId(v)} aria-label="انتخاب بسته‌بندی">{wrappings.map(w => <ToggleGroupItem key={w.id} value={w.id}><span className="paper-swatch" style={{ background: w.color }}/>{w.name} · {money(w.price)} تومان</ToggleGroupItem>)}</ToggleGroup><h3>سبک گل‌آرایی</h3><ToggleGroup type="single" value={arrangement} onValueChange={v => v && setArrangement(v)}>{arrangements.map(a => <ToggleGroupItem key={a} value={a}>{a}</ToggleGroupItem>)}</ToggleGroup><h3>رنگ روبان</h3><ToggleGroup type="single" value={ribbon} onValueChange={v => v && setRibbon(v)}>{["زرشکی", "سبز", "شیری"].map(r => <ToggleGroupItem key={r} value={r}>{r}</ToggleGroupItem>)}</ToggleGroup></section>
    </div>
    <aside className="bouquet-summary"><div className="bouquet-preview" style={{ background: summary.wrapping.color }}><div className="preview-topline"><Leaf size={18}/><span>چیدمان شما، به روایت مارلو</span></div><div className="preview-flowers">{summary.selected.length ? summary.selected.map(p => <div key={p.id}><FlowerDrawing pack={p} small/><span>{money(p.qty)} بسته</span></div>) : <div className="preview-empty"><Flower2 size={62}/><span>اولین گل را انتخاب کن</span></div>}</div><small>تصویر شماتیک، نه پیش‌نمایش دقیق محصول</small></div><div className="summary-content"><h2>یک دسته‌گل، فقط برای تو</h2><div className="stem-count"><Package size={18}/><span>{money(summary.packCount)} بسته · {summary.minStems === summary.maxStems ? money(summary.minStems) : `${money(summary.minStems)} تا ${money(summary.maxStems)}`} شاخه</span></div>{summary.selected.map(p => <div className="summary-line" key={p.id}><span>{p.name} × {money(p.qty)} بسته</span><strong>{money(p.price * p.qty)}</strong></div>)}{summary.selected.length > 0 && <><div className="summary-line"><span>{summary.wrapping.name}</span><strong>{money(summary.wrapping.price)}</strong></div><div className="summary-line"><span>دستمزد گل‌آرایی</span><strong>{money(ARRANGING_FEE)}</strong></div></>}<div className="summary-total"><span>قیمت دسته‌گل</span><strong>{money(summary.price)} <small>تومان</small></strong></div><p className="sample-note">ارسال جداگانه در سبد محاسبه می‌شود. تحویل از فردا، فقط تهران.</p>{unavailable && <p role="alert" className="error-note">موجودی یکی از گل‌ها کافی نیست؛ تعداد را کاهش بده.</p>}<Button disabled={!summary.selected.length || unavailable} onClick={add}>افزودن دسته‌گل دلخواه به سبد <Plus/></Button><Button variant="outline" onClick={onCart}>دیدن سبد خرید <ArrowLeft/></Button><small className="sample-note">تعداد داوودی ممکن است ۴ یا ۵ شاخه باشد؛ حداقل و حداکثر مجموع نمایش داده می‌شود.</small></div></aside></div>
  </main>;
}
