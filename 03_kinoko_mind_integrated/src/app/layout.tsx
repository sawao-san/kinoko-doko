import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "🍄 信州キノコ専門家黒板 (Nagano Mind) × キノコどこどこ",
  description: "AI時代の能動的アウトプット学習支援プラットフォーム。キノコをホワイトボードで図解し、声で教える。説明したキノコの実物検索写真や原田さんのキノコマップと合体連携。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
