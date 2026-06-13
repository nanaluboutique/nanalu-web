/**
 * Tiny classname joiner: filters out falsy values and joins with spaces.
 * Lets components compose a base set of classes with conditional/override ones,
 * e.g. cn("rounded-pill", isActive && "bg-primary", className).
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
