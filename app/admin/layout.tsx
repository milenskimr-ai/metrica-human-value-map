import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · METRICA HUMAN VALUE MAP",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-canvas">{children}</div>;
}
