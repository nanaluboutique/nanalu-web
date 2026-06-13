import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type TagVariant = "custom" | "ooak" | "eyebrow";

const variantClass: Record<TagVariant, string> = {
  custom: "tag tag-custom", // "Customizable" badge
  ooak: "tag tag-ooak", // "One of a kind" badge
  eyebrow: "eyebrow", // section kicker / label
};

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
}

export function Tag({ variant = "ooak", className, ...props }: TagProps) {
  return <span className={cn(variantClass[variant], className)} {...props} />;
}
