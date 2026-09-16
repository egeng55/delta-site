export function authRedirect(value: string | null, fallback = "/hq"): string {
  if (
    !value ||
    !value.startsWith("/") ||
    /[\\\s\x00-\x1f]/.test(value) ||
    value.startsWith("//")
  )
    return fallback;
  try {
    const url = new URL(value, "https://delta.invalid");
    if (
      url.origin !== "https://delta.invalid" ||
      /^\/(login|signup)(\/|$)/.test(url.pathname)
    )
      return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
