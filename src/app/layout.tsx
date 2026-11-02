import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feynman Board | ファインマン黒板 - 3分で人に教えて理解する",
  description: "AI時代の能動的アウトプット学習支援プラットフォーム。自分で調べ、ホワイトボードで図解し、声で教える。AI赤ペン先生があなたの理解度を瞬時にフィードバック。",
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
