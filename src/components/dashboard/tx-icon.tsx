"use client";

import {
  ShoppingCart,
  Briefcase,
  Tv,
  Fuel,
  Coffee,
  Music,
  Wine,
  Lightbulb,
  Smartphone,
  Clapperboard,
  Pill,
  Bus,
  Palette,
  Cloud,
  Sparkles,
  Newspaper,
  CreditCard,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "shopping-cart": ShoppingCart,
  briefcase: Briefcase,
  tv: Tv,
  fuel: Fuel,
  coffee: Coffee,
  music: Music,
  wine: Wine,
  lightbulb: Lightbulb,
  smartphone: Smartphone,
  clapperboard: Clapperboard,
  pill: Pill,
  bus: Bus,
  palette: Palette,
  cloud: Cloud,
  sparkles: Sparkles,
  newspaper: Newspaper,
  "credit-card": CreditCard,
};

export function TxIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = iconMap[icon] || CreditCard;
  return <Icon className={className ?? "w-[17px] h-[17px]"} />;
}
