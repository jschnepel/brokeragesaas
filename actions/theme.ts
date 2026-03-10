"use server";

import { ThemeService } from "@/services";
import type { TenantTheme, ThemeTokens } from "@/services";
import { TENANT_ID } from "@/lib/constants";

export async function getTheme(): Promise<TenantTheme | null> {
  return ThemeService.getTheme(TENANT_ID);
}

export async function getAllThemes(): Promise<TenantTheme[]> {
  return ThemeService.getAllThemes();
}

export async function saveTheme(themeName: string, tokens: ThemeTokens): Promise<void> {
  await ThemeService.saveTheme(TENANT_ID, themeName, tokens);
}
