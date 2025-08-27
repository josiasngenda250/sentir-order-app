// app/api/export/route.ts
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import crypto from "crypto";

// Force Node runtime (env vars available here)
export const runtime = "nodejs";

function timingSafeEqualStr(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("secret") || "").trim();
  const h = (req.headers.get("x-export-secret") || "").trim();
  const expected = (process.env.EXPORT_SECRET || "").trim();

  // Reject if not configured
  if (!expected) {
    return new NextResponse("Server not configured (missing EXPORT_SECRET)", { status: 500 });
  }

  // Accept either query or header match
  const provided = h || q;
  if (!provided || !timingSafeEqualStr(provided, expected)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Build CSV (change columns as you like)
  const { rows } = await sql/* sql */`
    SELECT
      id,
      created_at,
      full_name,
      email,
      phone,
      preferred_contact,
      addr1,
      addr2,
      city,
      province,
      postal,
      country,
      product,
      product_code,
      quantity,
      shipping_option,
      shipping_cost,
      item_subtotal,
      order_total,
      payment_method,
      requests
    FROM sentir_orders
    ORDER BY created_at DESC
  `;

  const header = [
    "id","created_at","full_name","email","phone","preferred_contact","addr1","addr2","city","province",
    "postal","country","product","product_code","quantity","shipping_option","shipping_cost","item_subtotal",
    "order_total","payment_method","requests"
  ];

  const csv = [
    header.join(","),
    ...rows.map(r => header.map(k => {
      const v = r[k as keyof typeof r];
      const s = v == null ? "" : String(v);
      // CSV escape
      const needsQuotes = /[",\n]/.test(s);
      const esc = s.replace(/"/g, '""');
      return needsQuotes ? `"${esc}"` : esc;
    }).join(","))
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sentir_orders.csv"`,
      "Cache-Control": "no-store",
    }
  });
}
