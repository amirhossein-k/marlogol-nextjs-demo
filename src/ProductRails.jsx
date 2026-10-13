"use client";
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, ArrowUpLeft } from "lucide-react";
import { money } from "./rules.mjs";
import "./rails.css";
function Rail({ id, title, subtitle, products, Photo, onOpen, onAdd, onBrowse, routingMode }) {
  const track = useRef(null);
  const [position, setPosition] = useState(0);
  const [end, setEnd] = useState(false);
  function sync() {
    const element = track.current;
    if (!element) return;
    const current = Math.abs(element.scrollLeft);
    setPosition(current);
    setEnd(current >= element.scrollWidth - element.clientWidth - 3);
  }
  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [products.length]);
  function move(direction) {
    const element = track.current;
    element?.scrollBy({ left: direction * element.clientWidth * .8, behavior: "smooth" });
  }
  if (!products.length) return null;
  return <section className="product-rail" aria-labelledby={`${id}-title`} aria-roledescription="carousel">
    <div className="rail-heading"><div><span className="eyebrow">{subtitle}</span><h2 id={`${id}-title`}>{title}</h2></div><div className="rail-actions"><button className="text-link" onClick={onBrowse}>دیدن همه <ArrowUpLeft size={17}/></button><button aria-label={`قبلی ${title}`} aria-controls={`${id}-track`} disabled={position < 2} onClick={() => move(1)}><ChevronRight size={20}/></button><button aria-label={`بعدی ${title}`} aria-controls={`${id}-track`} disabled={end} onClick={() => move(-1)}><ChevronLeft size={20}/></button></div></div>
    <div className="rail-track" id={`${id}-track`} ref={track} onScroll={sync} tabIndex={0} aria-label={title}>{products.map(product => <article className="rail-card" key={product.id}><button className="rail-image" aria-label={`دیدن ${product.name}`} onClick={() => onOpen(product)}><Photo product={product}/><span>{product.label}</span></button><div className="rail-card-info"><div><small>{product.category}</small>{routingMode === "path" && !product.id.startsWith("product-") && !product.id.startsWith("demo-") ? <a href={`/products/${product.slug}`}><h3>{product.name}</h3></a> : <button className="product-name" onClick={() => onOpen(product)}><h3>{product.name}</h3></button>}<p>{money(product.price)} <small>تومان</small></p></div><button className="add-circle" aria-label={`افزودن از اسلایدر ${product.name}`} onClick={() => onAdd(product)}><Plus size={20}/></button></div></article>)}</div>
    <p className="rail-hint">برای دیدن گل‌های بیشتر، ردیف را بکشید.</p>
  </section>;
}
export default function ProductRails(props) {
  const available = props.products.filter(p => p.stock > 0);
  return <div className="home-rails">
    <Rail {...props} id="marlo-selection" title="گل‌های مارلو، برای یک حال خوب" subtitle="THE MARLO EDIT" products={available} onBrowse={() => props.onBrowse("همه گل‌ها")}/>
    <Rail {...props} id="ready-bouquets" title="دسته‌گل‌های آماده، با سلیقه چیده‌شده" subtitle="A BOUQUET FOR YOUR MOMENT" products={available.filter(p => p.category === "دسته‌گل")} onBrowse={() => props.onBrowse("دسته‌گل")}/>
    <Rail {...props} id="little-gifts" title="هدیه‌های زیر دو میلیون تومان" subtitle="A LITTLE GIFT, A BIG FEELING" products={available.filter(p => p.price < 2000000)} onBrowse={() => props.onBrowse("همه گل‌ها")}/>
  </div>;
}
