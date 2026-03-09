'use server';

import { auth } from '@/auth';
import { ThemeService } from '@/services';
import type { ThemeTokens, TenantTheme } from '@/services';

export async function getCurrentTheme(): Promise<TenantTheme | null> {
  return ThemeService.getTheme('russ-lyon');
}

export async function getAllThemes(): Promise<TenantTheme[]> {
  return ThemeService.getAllThemes();
}

export async function saveTheme(themeName: string, tokens: ThemeTokens): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const role = (session.user as { role?: string }).role;
  const allowed = ['marketing_manager', 'executive', 'platform_admin'];
  if (!role || !allowed.includes(role)) throw new Error('Forbidden');
  await ThemeService.saveTheme('russ-lyon', themeName, tokens);
}
