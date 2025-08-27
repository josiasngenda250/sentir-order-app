import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { sql } from "@vercel/postgres";
import { z } from "zod";
import { sendAdminEmail, sendCustomerEmail } from "@/lib/email";

const toInt = (v: unknown) => {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  preferredContact: z.string().optional().nullable(),
  addr1: z.string().min(1),
  addr2: z.string().optional().nullable(),
  city: z.string().min(1),
  province: z.string().min(1),
  postal: z.string().min(1),
  country: z.string().min(1),
  product: z.string().min(1),
  productCode: z.enum(["LATTE","STRAWBERRY_MATCHA","MANGO","TRIO"]),
  quantity: z.preprocess(toInt, z.number().int().positive()),
  shippingOption: z.string().min(1),
  shippingCost: z.preprocess(toInt, z.number().int().nonnegative()),
  itemSubtotal: z.preprocess(toInt, z.number().int().nonnegative()),
  orderTotal: z.preprocess(toInt, z.number().int().positive()),
  paymentMethod: z.enum(["etransfer","paypal"]),
  requests: z.string().optional().nullable(),
});

function unitPrice(code: "LATTE"|"STRAWBERRY_MATCHA"|"MANGO"|"TRIO"){ return code==="TRIO" ? 77 : 30; }

export async function POST(req: Request){
  try{
    await ensureSchema();
    const body = await req.json();
    const data = schema.parse(body);

    const recomputedSubtotal = unitPrice(data.productCode) * data.quantity;
    const recomputedTotal = recomputedSubtotal + data.shippingCost;
    if(recomputedSubtotal !== data.itemSubtotal || recomputedTotal !== data.orderTotal){
      return NextResponse.json({
        error: "Totals mismatch",
        details: { recomputedSubtotal, recomputedTotal, received:{ itemSubtotal: data.itemSubtotal, orderTotal: data.orderTotal } }
      }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO sentir_orders
      (full_name, email, phone, preferred_contact, addr1, addr2, city, province, postal, country,
       product, product_code, quantity, shipping_option, shipping_cost, item_subtotal, order_total,
       payment_method, requests)
      VALUES
      (${data.fullName}, ${data.email}, ${data.phone || null}, ${data.preferredContact || null},
       ${data.addr1}, ${data.addr2 || null}, ${data.city}, ${data.province}, ${data.postal}, ${data.country},
       ${data.product}, ${data.productCode}, ${data.quantity}, ${data.shippingOption}, ${data.shippingCost},
       ${data.itemSubtotal}, ${data.orderTotal}, ${data.paymentMethod}, ${data.requests || null})
      RETURNING id, created_at;
    `;
    const id = rows[0].id as string;

    const orderHtml = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial;line-height:1.5">
        <h2>Thank you for your order, ${data.fullName}!</h2>
        <p>We’ve received your order from <strong>Sentir</strong>. Here’s your summary:</p>
        <p>
          <strong>Product:</strong> ${data.product} (${data.productCode})<br/>
          <strong>Quantity:</strong> ${data.quantity}<br/>
          <strong>Shipping:</strong> ${data.shippingOption} ($${data.shippingCost} CAD)<br/>
          <strong>Item Subtotal:</strong> $${data.itemSubtotal} CAD<br/>
          <strong>Order Total:</strong> $${data.orderTotal} CAD<br/>
          <strong>Payment:</strong> ${data.paymentMethod === "etransfer" ? "Interac e-transfer (send to mutabazisabine27@gmail.com)" : "PayPal (send to nemutv11@gmail.com)"}<br/>
          <strong>Order ID:</strong> ${id}
        </p>
        <h3>Shipping to</h3>
        <p>
          ${data.addr1}${data.addr2 ? "<br/>"+data.addr2 : ""}<br/>
          ${data.city}, ${data.province} ${data.postal}<br/>
          ${data.country}
        </p>
        ${data.requests ? `<h3>Notes</h3><p>${data.requests.replace(/</g,"&lt;")}</p>` : ""}
        <p>Reply to this email if you need any changes. — Sentir</p>
      </div>
    `;

    let customerEmailError: string | null = null;
    let adminEmailError: string | null = null;

    try { await sendCustomerEmail(data.email, orderHtml); }
    catch(e:any){ console.error("sendCustomerEmail failed:", e?.message||e); customerEmailError = e?.message || String(e); }

    try {
      await sendAdminEmail(
        `
          <div style="font-family:system-ui,Segoe UI,Roboto,Arial;line-height:1.5">
            <h2>New Sentir order</h2>
            <p><strong>Name:</strong> ${data.fullName}<br/>
               <strong>Email:</strong> ${data.email}<br/>
               <strong>Phone:</strong> ${data.phone || ""}<br/>
               <strong>Preferred contact:</strong> ${data.preferredContact || ""}</p>
            <h3>Order</h3>
            <p>
              <strong>Product:</strong> ${data.product} (${data.productCode})<br/>
              <strong>Qty:</strong> ${data.quantity}<br/>
              <strong>Shipping:</strong> ${data.shippingOption} ($${data.shippingCost})<br/>
              <strong>Item Subtotal:</strong> $${data.itemSubtotal}<br/>
              <strong>TOTAL:</strong> $${data.orderTotal}<br/>
              <strong>Payment:</strong> ${data.paymentMethod}
            </p>
            <h3>Ship to</h3>
            <p>${data.addr1}${data.addr2 ? "<br/>"+data.addr2 : ""}<br/>${data.city}, ${data.province} ${data.postal}<br/>${data.country}</p>
            ${data.requests ? `<h3>Notes</h3><p>${data.requests.replace(/</g,"&lt;")}</p>` : ""}
            <p><strong>Order ID:</strong> ${id}</p>
          </div>
        `,
        `New order — ${data.fullName} — $${data.orderTotal} CAD`
      );
    } catch(e:any){ console.error("sendAdminEmail failed:", e?.message||e); adminEmailError = e?.message || String(e); }

    return NextResponse.json({ ok: true, id, customerEmailError, adminEmailError });
  }catch(err: any){
    console.error("order route error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
