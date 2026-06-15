import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/*
 * Container — the shared page-width wrapper (mockup's `.wrap`):
 * max-width 1180px, centred, with 30px side padding. Everything the header,
 * footer, and pages render goes inside one of these so content lines up.
 */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[1180px] px-[30px]", className)} {...props} />;
}
