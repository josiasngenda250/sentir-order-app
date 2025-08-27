"use client";

import { useMemo, useState } from "react";

type ProductCode = "LATTE" | "STRAWBERRY_MATCHA" | "MANGO" | "TRIO";

const PRODUCT_LABEL: Record<ProductCode, string> = {
  LATTE: "LATTE CANDLE — $30 CAD",
  STRAWBERRY_MATCHA: "STRAWBERRY MATCHA LATTE CANDLE — $30 CAD",
  MANGO: "MANGO LATTE CANDLE — $30 CAD",
  TRIO: "THE TRIO SET (all 3) — $77 CAD",
};

function unitPrice(code: ProductCode) {
  return code === "TRIO" ? 77 : 30;
}

export default function Page() {
  const [product, setProduct] = useState<ProductCode | null>(null);
  const [qtySingle, setQtySingle] = useState<string>("1");
  const [qtyTrio, setQtyTrio] = useState<string>("1");
  const [shipping, setShipping] = useState<"standard" | "calgary" | "express" | "">("");
  const [pay, setPay] = useState<"etransfer" | "paypal" | "">("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const qty = useMemo(() => {
    if (!product) return 0;
    const raw = product === "TRIO" ? qtyTrio : qtySingle;
    return raw === "other" ? 0 : Number(raw || 0);
  }, [product, qtySingle, qtyTrio]);

  const shipCost = shipping === "" ? 0 : shipping === "calgary" ? 0 : shipping === "standard" ? 14 : 23;
  const sub = (product ? unitPrice(product) : 0) * qty;
  const total = sub + shipCost;

  const canSubmit = !!product && qty > 0 && shipping !== "" && pay !== "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    if (!canSubmit) {
      setMsg("Please complete all required selections.");
      return;
    }
    const form = e.currentTarget as any;
    const fd = new FormData(form);

    const body = {
      fullName: String(fd.get("fullName") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      preferredContact: String(fd.get("preferredContact") || ""),
      addr1: String(fd.get("addr1") || ""),
      addr2: String(fd.get("addr2") || ""),
      city: String(fd.get("city") || ""),
      province: String(fd.get("province") || ""),
      postal: String(fd.get("postal") || ""),
      country: String(fd.get("country") || "Canada"),
      product: product ? PRODUCT_LABEL[product] : "",
      productCode: product || "LATTE",
      quantity: qty,
      shippingOption:
        shipping === "calgary"
          ? "Ship within Calgary — Free"
          : shipping === "standard"
          ? "Standard Canada Post — $14 CAD (3–7 business days)"
          : "Express Canada Post — $23 CAD (1–3 business days)",
      shippingCost: shipCost,
      itemSubtotal: sub,
      orderTotal: total,
      paymentMethod: pay || "etransfer",
      requests: String(fd.get("requests") || ""),
    };

    if (!body.fullName || !body.email || !body.addr1 || !body.city || !body.province || !body.postal) {
      setMsg("Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      const data = await res.json();

      // 👇 See exactly what the API returned (IDs or error messages)
      console.log("ORDER RESPONSE", data);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to place order");
      }

      // If emails had issues, show details before redirecting
      if (data.customerEmailError || data.adminEmailError) {
        const issues = [
          data.customerEmailError ? `Customer email error: ${data.customerEmailError}` : "",
          data.adminEmailError ? `Admin email error: ${data.adminEmailError}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        alert(
          "Order saved successfully, but there was an issue sending one or more emails:\n\n" +
            issues +
            "\n\nWe will re-send manually if needed."
        );
      }

      // Delay so you can read the console log
      setTimeout(() => {
        window.location.href = "/success";
      }, 1500);
    } catch (err: any) {
      setMsg(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <p className="text-gray-700 mb-4">
        Each candle is crafted fresh when you order, with premium soy wax and clean-burning wicks.{" "}
        <strong>No tax charges.</strong>
      </p>

      <form onSubmit={submit}>
        {/* Customer */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2">Customer details</h2>
          <div className="field">
            <label className="label">Full name*</label>
            <input className="input" name="fullName" required placeholder="Your name" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Email*</label>
              <input className="input" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input className="input" name="phone" type="tel" placeholder="(optional)" />
            </div>
          </div>
          <div className="field">
            <label className="label">Preferred contact method*</label>
            <select name="preferredContact" required className="select">
              <option value="">Select…</option>
              <option>Phone</option>
              <option>Email</option>
            </select>
          </div>

          <div className="h-px bg-gray-200 my-4" />
          <h3 className="font-semibold mb-2">Shipping address</h3>
          <div className="field">
            <label className="label">Address line 1*</label>
            <input className="input" name="addr1" required placeholder="Street address" />
          </div>
          <div className="field">
            <label className="label">Address line 2</label>
            <input className="input" name="addr2" placeholder="Apartment, suite (optional)" />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="field">
              <label className="label">City*</label>
              <input className="input" name="city" required />
            </div>
            <div className="field">
              <label className="label">Province/State*</label>
              <input className="input" name="province" required />
            </div>
            <div className="field">
              <label className="label">Postal code*</label>
              <input className="input" name="postal" required />
            </div>
          </div>
          <div className="field">
            <label className="label">Country*</label>
            <input className="input" name="country" defaultValue="Canada" required />
          </div>
        </section>

        {/* Order */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2">Drink Candle Collection</h2>
          <div className="grid gap-2">
            {(Object.keys(PRODUCT_LABEL) as ProductCode[]).map((code) => (
              <label key={code} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                <input type="radio" name="p" onChange={() => setProduct(code)} checked={product === code} />
                <span>{PRODUCT_LABEL[code]}</span>
              </label>
            ))}
          </div>

          {product && product !== "TRIO" && (
            <div className="grid md:grid-cols-3 gap-3 mt-3">
              <div className="field">
                <label className="label">Quantity*</label>
                <select className="select" value={qtySingle} onChange={(e) => setQtySingle(e.target.value)}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
          )}

          {product === "TRIO" && (
            <div className="grid md:grid-cols-3 gap-3 mt-3">
              <div className="field">
                <label className="label">Number of sets*</label>
                <select className="select" value={qtyTrio} onChange={(e) => setQtyTrio(e.target.value)}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-3">
            <h3 className="font-semibold mb-2">Shipping option</h3>
            <div className="grid gap-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                <input type="radio" name="s" onChange={() => setShipping("standard")} checked={shipping === "standard"} />
                <span>Standard Canada Post — $14 CAD (3–7 business days)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                <input type="radio" name="s" onChange={() => setShipping("calgary")} checked={shipping === "calgary"} />
                <span>Ship within Calgary — Free</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                <input type="radio" name="s" onChange={() => setShipping("express")} checked={shipping === "express"} />
                <span>Express Canada Post — $23 CAD (1–3 business days)</span>
              </label>
            </div>
          </div>
        </section>

        {/* Totals */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2">Totals (shipping included)</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="note">
              Item subtotal: <strong>${sub} CAD</strong>
            </div>
            <div className="note">
              Shipping: <strong>${shipCost} CAD</strong>
            </div>
            <div className="note total">Order total: ${total} CAD</div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Examples — Standard: 1 candle $44, 2 $74, 3 $104 · Express: 1 $53, 2 $83, 3 $113
          </p>
        </section>

        {/* Payment */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2">Payment</h2>
          <div className="grid gap-2">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
              <input type="radio" name="pay" onChange={() => setPay("etransfer")} checked={pay === "etransfer"} />
              <span>
                Interac e-transfer — send to <strong>mutabazisabine27@gmail.com</strong>
              </span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
              <input type="radio" name="pay" onChange={() => setPay("paypal")} checked={pay === "paypal"} />
              <span>
                PayPal — send to <strong>nemutv11@gmail.com</strong>
              </span>
            </label>
          </div>
        </section>

        <section className="mb-6">
          <label className="label">Requests / comments</label>
          <textarea className="input" name="requests" placeholder="Scent notes, gift message, delivery preferences…" />
        </section>

        <div className="mb-4">
          <label className="text-sm text-gray-700">
            <input type="checkbox" required className="mr-2" /> I confirm my order details are correct.
          </label>
        </div>

        <button disabled={!canSubmit || loading} className="btn">
          {loading ? "Placing order…" : "Place order"}
        </button>
        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
      </form>
    </div>
  );
}
