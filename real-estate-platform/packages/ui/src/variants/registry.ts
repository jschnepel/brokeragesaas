import type { ComponentType } from 'react';
import { GeoJSONMap, GeoJSONMapProps } from './GeoJSONMap';
import { DropdownMenu, DropdownMenuProps } from './DropdownMenu';

type VariantComponent = ComponentType<GeoJSONMapProps> | ComponentType<DropdownMenuProps>;

interface VariantConfig {
  component: VariantComponent;
  description: string;
  category: 'map' | 'navigation' | 'form' | 'display';
}

const variantRegistry: Record<string, VariantConfig> = {
  'map-geojson': {
    component: GeoJSONMap as VariantComponent,
    description: 'Interactive map with GeoJSON support',
    category: 'map',
  },
  'dropdown-menu': {
    component: DropdownMenu as VariantComponent,
    description: 'Dropdown menu for navigation',
    category: 'navigation',
  },
};

export function getVariantComponent(variantKey: string): VariantComponent | null {
  const config = variantRegistry[variantKey];
  return config?.component || null;
}

export function getVariantsByCategory(category: VariantConfig['category']): string[] {
  return Object.entries(variantRegistry)
    .filter(([, config]) => config.category === category)
    .map(([key]) => key);
}

export function getAllVariants(): Record<string, VariantConfig> {
  return { ...variantRegistry };
}

export function registerVariant(key: string, config: VariantConfig): void {
  variantRegistry[key] = config;
}
