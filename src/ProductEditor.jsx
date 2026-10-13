"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { validateProduct, productCategories } from "./product-validation.mjs";
import { Plus, Check, LoaderCircle } from "lucide-react";
const empty = { name: "", slug: "", category: "دسته‌گل", price: "", stock: "1", photo: "hero", label: "", description: "" };
export default function ProductEditor({ product, onSave, photos, databaseMode }) {
  const [draft, setDraft] = useState(product ? { ...product, price: String(product.price), stock: String(product.stock) } : empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function set(key, value) { setDraft(previous => ({ ...previous, [key]: value })); setError(""); }
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const data = validateProduct({ ...draft, price: draft.price === "" ? NaN : Number(draft.price), stock: draft.stock === "" ? NaN : Number(draft.stock) });
      await onSave(data);
    } catch (err) { setError(err.message || "ذخیره انجام نشد؛ دوباره امتحان کنید."); }
    finally { setBusy(false); }
  }
  return <form className="product-editor" onSubmit={submit}>
    <FieldGroup>
      <Field><FieldLabel htmlFor="product-name">نام محصول</FieldLabel><Input id="product-name" required minLength={2} maxLength={100} value={draft.name} onChange={e => set("name", e.target.value)} placeholder="مثلاً دسته‌گل رؤیای بهاری"/></Field>
      <Field><FieldLabel htmlFor="product-slug">نشانی انگلیسی محصول</FieldLabel><Input id="product-slug" dir="ltr" required pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={2} maxLength={80} value={draft.slug} onChange={e => set("slug", e.target.value)} placeholder="spring-dream"/><FieldDescription>باید یکتا باشد؛ فقط حروف کوچک انگلیسی، عدد و خط تیره.</FieldDescription></Field>
      <div className="editor-numbers"><Field><FieldLabel htmlFor="product-price">قیمت (تومان)</FieldLabel><Input id="product-price" type="number" required min={1000} max={1000000000} step={1} value={draft.price} onChange={e => set("price", e.target.value)}/></Field><Field><FieldLabel htmlFor="product-stock">موجودی محصول</FieldLabel><Input id="product-stock" type="number" required min={0} max={10000} step={1} value={draft.stock} onChange={e => set("stock", e.target.value)}/></Field></div>
      <Field><FieldLabel>دسته‌بندی</FieldLabel><ToggleGroup type="single" value={draft.category} onValueChange={v => v && set("category", v)}>{productCategories.map(c => <ToggleGroupItem key={c} value={c}>{c}</ToggleGroupItem>)}</ToggleGroup></Field>
      <Field><FieldLabel htmlFor="product-label">برچسب روی کارت</FieldLabel><Input id="product-label" maxLength={40} value={draft.label} onChange={e => set("label", e.target.value)} placeholder="انتخاب ویژه"/></Field>
      <Field><FieldLabel htmlFor="product-description">توضیحات محصول</FieldLabel><Textarea id="product-description" required minLength={10} maxLength={2000} rows={4} value={draft.description} onChange={e => set("description", e.target.value)} placeholder="گل‌ها، ترکیب و ویژگی‌های بسته‌بندی..."/></Field>
      <Field><FieldLabel>انتخاب تصویر</FieldLabel><div className="editor-photos">{Object.entries(photos).map(([key, image]) => <button type="button" key={key} onClick={() => set("photo", key)} aria-label={`تصویر ${key}`} aria-pressed={draft.photo === key}><img src={image} alt={`تصویر نمونه ${key}`}/>{draft.photo === key && <Check size={18}/>}</button>)}</div><FieldDescription>گالری تصاویر نمونه؛ بارگذاری فایل شخصی در این نسخه اضافه نشده است.</FieldDescription></Field>
    </FieldGroup>
    {error && <p className="error-note" role="alert">{error}</p>}
    <p className="sample-note">{databaseMode ? "ذخیره در MongoDB محلی انجام می‌شود؛ سفارش و پرداخت همچنان نمایشی‌اند." : "در پیش‌نمایش، محصول فقط در همین مرورگر ذخیره می‌شود."}</p>
    <Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin"/> : <Plus/>}{busy ? "در حال ذخیره..." : product ? "ذخیره تغییرات محصول" : "ساخت محصول"}</Button>
  </form>;
}
