"use client";

import { BarChart3, Headset, Lightbulb, Package } from "lucide-react";
import { useFlow } from "@/lib/state";

const SERVICES = [
  { id: "customer_service", Icon: Headset },
  { id: "fulfillment", Icon: Package },
  { id: "data_technology", Icon: BarChart3 },
  { id: "cx_consulting", Icon: Lightbulb },
] as const;

export function Services() {
  const { t } = useFlow();
  return (
    <section className="border-t border-line pt-10 text-center">
      <p className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{t("services.headline")}</p>
      <p className="mt-2 text-muted">{t("services.subline")}</p>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SERVICES.map(({ id, Icon }) => (
          <li key={id} className="flex flex-col items-center gap-3 rounded-2xl bg-white px-3 py-5 shadow-card">
            <Icon className="size-6 text-accent-600" strokeWidth={1.7} />
            <span className="text-xs font-bold tracking-[0.12em] text-navy-900">{t(`services.items.${id}`)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
