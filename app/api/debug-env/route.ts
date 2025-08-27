import { NextResponse } from "next/server";

export async function GET() {
  const env = process.env;
  return NextResponse.json({
    POSTGRES_URL: !!env.POSTGRES_URL,
    RESEND_API_KEY: !!env.RESEND_API_KEY,
    FROM_EMAIL: !!env.FROM_EMAIL,
    ADMIN_EMAILS_count: (env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean).length,
    EXPORT_SECRET: !!env.EXPORT_SECRET,
    nodeEnv: env.NODE_ENV || null,
  });
}
