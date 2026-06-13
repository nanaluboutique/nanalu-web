import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/** Card surface — mockup `.card` (white, 18px radius, shadow, hover-lift). */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

/** Inner padding for card content — mockup `.card-body`. */
export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-body", className)} {...props} />;
}
