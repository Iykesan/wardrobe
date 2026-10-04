import type { Metadata } from "next";
import "@/shared/styles/globals.css";
import Sidebar from "@/shared/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Wardrobe",
  description:
    "A clean digital wardrobe to catalog items, build outfits, and plan what to wear.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen px-6 py-6">
          <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1400px] gap-6">
            <Sidebar />
            <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col">
              <div className="flex-1 rounded-[var(--radius-card)] border border-border bg-canvas/90 p-8 shadow-[var(--shadow-soft)] backdrop-blur-sm">
                {children}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
