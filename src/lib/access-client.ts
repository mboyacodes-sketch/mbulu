const ACCESS_STORAGE_KEY = "mbulu.access.v1";

export function loadAccessSecret(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(ACCESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveAccessSecret(secret: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ACCESS_STORAGE_KEY, secret);
  } catch {
    // ignore storage failures
  }
}

export function clearAccessSecret() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ACCESS_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}
