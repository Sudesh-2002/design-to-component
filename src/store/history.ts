import { create } from "zustand";
import { makeThumbnail } from "@/lib/thumbnail";
import { makeTitle } from "@/lib/title";
import {
  MAX_SAVED_CODE_CHARS,
  createGeneration,
  deleteGeneration,
  listGenerations,
  updateGeneration,
} from "@/lib/supabase/generations";
import { usePlayground } from "@/store/playground";
import type { SavedGeneration } from "@/types";

interface HistoryState {
  open: boolean;
  items: SavedGeneration[];
  loading: boolean;
  saving: boolean;
  listError: string | null;
  saveError: string | null;

  setOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  save: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

const message = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

export const useHistory = create<HistoryState>((set, get) => ({
  open: false,
  items: [],
  loading: false,
  saving: false,
  listError: null,
  saveError: null,

  setOpen: (open) => set({ open }),

  refresh: async () => {
    set({ loading: true, listError: null });
    try {
      set({ items: await listGenerations() });
    } catch (err) {
      set({ listError: message(err) });
    } finally {
      set({ loading: false });
    }
  },

  save: async () => {
    if (get().saving) return;

    const { code, prompt, image, activeId } = usePlayground.getState();
    if (!code.trim()) return;

    if (code.length > MAX_SAVED_CODE_CHARS) {
      set({ saveError: "This component is too large to save (50,000 character limit)." });
      return;
    }

    set({ saving: true, saveError: null });
    try {
      if (activeId) {
        const row = await updateGeneration(activeId, { code });
        set((s) => ({ items: s.items.map((i) => (i.id === row.id ? row : i)) }));
        usePlayground.setState({ savedCode: row.code });
      } else {
        const thumbnail = image
          ? await makeThumbnail(image.dataUrl).catch(() => null)
          : null;

        const row = await createGeneration({
          title: makeTitle(prompt),
          prompt,
          code,
          thumbnail,
        });
        set((s) => ({ items: [row, ...s.items] }));
        usePlayground.setState({ activeId: row.id, savedCode: row.code });
      }
    } catch (err) {
      set({ saveError: message(err) });
    } finally {
      set({ saving: false });
    }
  },

  remove: async (id) => {
    set({ listError: null });
    try {
      await deleteGeneration(id);
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      if (usePlayground.getState().activeId === id) {
        usePlayground.setState({ activeId: null, savedCode: "" });
      }
    } catch (err) {
      set({ listError: message(err) });
    }
  },

  reset: () => {
    set({
      open: false,
      items: [],
      loading: false,
      saving: false,
      listError: null,
      saveError: null,
    });
    usePlayground.setState({ activeId: null, savedCode: "" });
  },
}));