import { getSupabase } from "@/lib/supabase/client";
import type { SavedGeneration } from "@/types";

export const MAX_SAVED_CODE_CHARS = 50_000;

const COLUMNS = "id, title, prompt, code, thumbnail, created_at, updated_at";

export async function listGenerations(limit = 30): Promise<SavedGeneration[]> {
  const { data, error } = await getSupabase()
    .from("generations")
    .select(COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as SavedGeneration[];
}

export async function createGeneration(input: {
  title: string;
  prompt: string;
  code: string;
  thumbnail: string | null;
}): Promise<SavedGeneration> {
  const { data, error } = await getSupabase()
    .from("generations")
    .insert(input)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as SavedGeneration;
}

export async function updateGeneration(
  id: string,
  patch: { code: string }
): Promise<SavedGeneration> {
  const { data, error } = await getSupabase()
    .from("generations")
    .update(patch)
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as SavedGeneration;
}

export async function deleteGeneration(id: string): Promise<void> {
  const { error } = await getSupabase().from("generations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}