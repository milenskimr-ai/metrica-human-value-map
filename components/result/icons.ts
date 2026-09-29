import {
  ClipboardList,
  Gauge,
  HeartHandshake,
  LifeBuoy,
  MessageSquareWarning,
  Repeat,
  Search,
  ShoppingBag,
  Truck,
  UserCog,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Dimension } from "@/config/scoring";
import type { JourneyMode, JourneyStage } from "@/config/journey";

export const DIMENSION_ICONS: Record<Dimension, LucideIcon> = {
  automation: Workflow,
  human_value: Users,
  cx_maturity: Gauge,
};

export const MODE_ICONS: Record<JourneyMode, LucideIcon> = {
  automate: Workflow,
  ai_human: UserCog,
  human: HeartHandshake,
};

export const STAGE_ICONS: Record<JourneyStage, LucideIcon> = {
  discover: Search,
  buy: ShoppingBag,
  order: ClipboardList,
  delivery: Truck,
  support: LifeBuoy,
  complaint: MessageSquareWarning,
  retention: Repeat,
};

/** Visual weight grows from routine → human, reinforcing "humans where it matters". */
export const MODE_STYLES: Record<JourneyMode, { badge: string; dot: string; soft: string }> = {
  automate: { badge: "bg-navy-50 text-navy-700 ring-1 ring-navy-100", dot: "bg-navy-100 text-navy-700", soft: "bg-navy-50" },
  ai_human: { badge: "bg-accent-50 text-accent-700 ring-1 ring-accent-100", dot: "bg-accent-100 text-accent-700", soft: "bg-accent-50" },
  human: { badge: "bg-navy-900 text-white", dot: "bg-navy-900 text-accent-400", soft: "bg-navy-900" },
};
