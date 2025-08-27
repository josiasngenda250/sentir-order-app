import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sentir — Candle Order",
  description: "Hand-crafted latte-inspired candles made to order.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-3xl mx-auto my-6 px-4">
          <header className="flex items-center gap-3 mb-4">
            <Logo />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Sentir</h1>
              <p className="text-sm text-gray-600">Drink Candle Collection</p>
            </div>
          </header>
          {children}
          <footer className="mt-10 text-center text-sm text-gray-500">© {new Date().getFullYear()} Sentir</footer>
        </div>
      </body>
    </html>
  );
}

function Logo(){
  return (
    <svg width="42" height="42" viewBox="0 0 64 64" className="drop-shadow-sm">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f1b980"/><stop offset="100%" stopColor="#f59f6b"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#g)" />
      <path d="M32 14c6 6 6 12 0 18-6-6-6-12 0-18z" fill="#fff" opacity=".9"/>
      <rect x="24" y="34" width="16" height="14" rx="4" fill="#fff"/>
    </svg>
  )
}
