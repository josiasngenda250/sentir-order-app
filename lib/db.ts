import { sql } from "@vercel/postgres";

export type OrderRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  preferred_contact: string | null;
  addr1: string;
  addr2: string | null;
  city: string;
  province: string;
  postal: string;
  country: string;
  product: string;
  product_code: string;
  quantity: number;
  shipping_option: string;
  shipping_cost: number;
  item_subtotal: number;
  order_total: number;
  payment_method: string;
  requests: string | null;
};

export async function ensureSchema(){
  // Needed for gen_random_uuid()
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
  await sql`
    CREATE TABLE IF NOT EXISTS sentir_orders (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      full_name text NOT NULL,
      email text NOT NULL,
      phone text,
      preferred_contact text,
      addr1 text NOT NULL,
      addr2 text,
      city text NOT NULL,
      province text NOT NULL,
      postal text NOT NULL,
      country text NOT NULL,
      product text NOT NULL,
      product_code text NOT NULL,
      quantity int NOT NULL,
      shipping_option text NOT NULL,
      shipping_cost int NOT NULL,
      item_subtotal int NOT NULL,
      order_total int NOT NULL,
      payment_method text NOT NULL,
      requests text
    );
  `;
}
