export function safeHref(href?: string): string | undefined {
  if (!href) return undefined;

  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("//")) return undefined;

  // Allow same-doc / relative paths without a scheme.
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../")
  ) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:"
    ) {
      return trimmed;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
