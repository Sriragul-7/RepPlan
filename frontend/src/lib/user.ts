import { STORAGE_KEYS } from "./constants";

export function getUserId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.USER_ID, id);
  }
  return id;
}
