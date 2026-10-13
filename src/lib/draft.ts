const KEY = "playground:draft";

interface Draft {
  prompt: string;
  code: string;
}

export function stashDraft(draft: Draft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
  }
}

export function takeDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);

    const parsed = JSON.parse(raw);
    if (typeof parsed?.prompt === "string" && typeof parsed?.code === "string") {
      return parsed;
    }
  } catch {
  }
  return null;
}