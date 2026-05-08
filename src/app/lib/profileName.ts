const PROFILE_NAME_STORAGE_KEY = "wordy.profile-name";
const PROFILE_NAME_EVENT = "wordy:profile-name-changed";

function normalizeProfileName(value: string | null | undefined) {
  return value?.trim() || "";
}

export function getStoredProfileName() {
  if (typeof window === "undefined") {
    return "";
  }

  return normalizeProfileName(window.localStorage.getItem(PROFILE_NAME_STORAGE_KEY));
}

export function resolveProfileName(preferredName?: string | null, fallbackEmail?: string | null) {
  const storedName = getStoredProfileName();

  if (storedName) {
    return storedName;
  }

  const normalizedPreferredName = normalizeProfileName(preferredName);
  if (normalizedPreferredName) {
    return normalizedPreferredName;
  }

  const emailPrefix = fallbackEmail?.split("@")[0];
  return normalizeProfileName(emailPrefix) || "사용자";
}

export function setStoredProfileName(name: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedName = normalizeProfileName(name);

  if (normalizedName) {
    window.localStorage.setItem(PROFILE_NAME_STORAGE_KEY, normalizedName);
  } else {
    window.localStorage.removeItem(PROFILE_NAME_STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent(PROFILE_NAME_EVENT, { detail: normalizedName }));
}

export function subscribeProfileName(listener: (name: string) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleProfileNameEvent = (event: Event) => {
    const customEvent = event as CustomEvent<string>;
    listener(normalizeProfileName(customEvent.detail));
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === PROFILE_NAME_STORAGE_KEY) {
      listener(normalizeProfileName(event.newValue));
    }
  };

  window.addEventListener(PROFILE_NAME_EVENT, handleProfileNameEvent as EventListener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(PROFILE_NAME_EVENT, handleProfileNameEvent as EventListener);
    window.removeEventListener("storage", handleStorage);
  };
}
