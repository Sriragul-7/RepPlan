import { supabase } from "./supabase";
import { STORAGE_KEYS } from "./constants";

function getLocalUserId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.USER_ID, id);
  }
  return id;
}

export function getUserId(): string {
  return getLocalUserId();
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return {
      "X-User-Id": session.user.id,
      Authorization: `Bearer ${session.access_token}`,
    };
  }
  return { "X-User-Id": getLocalUserId() };
}
