import { invoke } from "./tauri";

export async function getSetting(key: string): Promise<string | null> {
  return invoke<string | null>("get_setting", { key });
}

export async function setSetting(key: string, value: string): Promise<void> {
  return invoke<void>("set_setting", { key, value });
}

export async function getAllSettings(): Promise<Array<[string, string]>> {
  return invoke<Array<[string, string]>>("get_all_settings");
}
