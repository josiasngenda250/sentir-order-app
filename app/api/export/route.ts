import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: Request){
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if(!key || key !== process.env.EXPORT_SECRET){
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { rows } = await sql`SELECT * FROM sentir_orders ORDER BY created_at DESC`;
  const headers = Object.keys(rows[0] || {
    id: "", created_at:"", full_name:"", email:"", phone:"", preferred_contact:"", addr1:"", addr2:"",
    city:"", province:"", postal:"", country:"", product:"", product_code:"", quantity:"", shipping_option:"",
    shipping_cost:"", item_subtotal:"", order_total:"", payment_method:"", requests:""
  });

  const escape = (v:any)=>{
    if(v==null) return "";
    const s = String(v).replace(/"/g,'""');
    return `"${s}"`;
  };
  const lines = [headers.join(",")];
  for(const row of rows){
    lines.push(headers.map(h=>escape((row as any)[h])).join(","));
  }
  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=sentir-orders.csv"
    }
  });
}
