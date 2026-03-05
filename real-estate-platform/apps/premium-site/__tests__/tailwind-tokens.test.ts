import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.resolve(__dirname, '../tailwind.config.js');
const globalsPath = path.resolve(__dirname, '../app/globals.css');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require(configPath);
const ext = config.theme.extend;
const globalsCSS = fs.readFileSync(globalsPath, 'utf8');

describe('Tailwind Design Tokens', () => {
  describe('Colors', () => {
    it('should define all brand color tokens', () => {
      const colors = Object.keys(ext.colors);
      expect(colors).toContain('navy');
      expect(colors).toContain('gold');
      expect(colors).toContain('cream');
      expect(colors).toContain('cream-alt');
      expect(colors).toContain('accent');
      expect(colors).toContain('navy-mid');
    });

    it('should use correct hex values from DESIGN_SYSTEM.md', () => {
      expect(ext.colors.navy).toBe('#0C1C2E');
      expect(ext.colors.gold).toBe('#BFA67A');
      expect(ext.colors.cream).toBe('#F9F8F6');
      expect(ext.colors['cream-alt']).toBe('#F5F5F0');
      expect(ext.colors.accent).toBe('#E07A5F');
      expect(ext.colors['navy-mid']).toBe('#162a42');
    });
  });

  describe('Typography', () => {
    it('should define all custom font sizes', () => {
      const sizes = Object.keys(ext.fontSize);
      const required = ['3xs', '2xs', 'meta', 'label', 'tab', 'body-lg', 'narrative'];
      for (const size of required) {
        expect(sizes).toContain(size);
      }
    });

    it('should define serif and sans font families', () => {
      expect(ext.fontFamily.serif).toBeDefined();
      expect(ext.fontFamily.sans).toBeDefined();
      expect(ext.fontFamily.serif[0]).toBe('Playfair Display');
      expect(ext.fontFamily.sans[0]).toBe('Inter');
    });

    it('should define custom tracking values', () => {
      const tracking = Object.keys(ext.letterSpacing);
      const required = ['xs', 'sm', 'md', 'lg', 'xl'];
      for (const t of required) {
        expect(tracking).toContain(t);
      }
    });
  });

  describe('Layout', () => {
    it('should define all content max-widths', () => {
      const widths = Object.keys(ext.maxWidth);
      const required = ['narrow', 'content-sm', 'content', 'content-lg', 'content-xl'];
      for (const w of required) {
        expect(widths).toContain(w);
      }
    });

    it('should use correct max-width values', () => {
      expect(ext.maxWidth['content-lg']).toBe('1600px');
      expect(ext.maxWidth['content-xl']).toBe('1800px');
    });
  });

  describe('Shadows', () => {
    it('should define shadow-card', () => {
      expect(ext.boxShadow.card).toBeDefined();
      expect(ext.boxShadow.card).toContain('0.05');
    });

    it('should define shadow-marker', () => {
      expect(ext.boxShadow.marker).toBeDefined();
    });
  });

  describe('Z-Index', () => {
    it('should define all z-index tokens', () => {
      const required = ['base', 'overlay', 'float', 'popup', 'nav'];
      for (const z of required) {
        expect(ext.zIndex[z]).toBeDefined();
      }
    });
  });

  describe('Animations', () => {
    it('should define all animation utilities', () => {
      const required = ['fadeIn', 'slide-up', 'fade-in', 'fade-in-up', 'float'];
      for (const a of required) {
        expect(ext.animation[a]).toBeDefined();
      }
    });

    it('should define all keyframes', () => {
      const required = ['fadeIn', 'fadeSlideIn', 'slideUp', 'fadeInUp', 'float', 'fade-in'];
      for (const k of required) {
        expect(ext.keyframes[k]).toBeDefined();
      }
    });
  });

  describe('globals.css', () => {
    it('should NOT contain sky-blue CSS variables', () => {
      expect(globalsCSS).not.toContain('#0ea5e9');
      expect(globalsCSS).not.toContain('color-primary-50');
      expect(globalsCSS).not.toContain('color-primary-500');
    });

    it('should NOT contain zinc CSS variables', () => {
      expect(globalsCSS).not.toContain('color-secondary-50');
      expect(globalsCSS).not.toContain('color-secondary-500');
    });

    it('should define brand CSS variables', () => {
      expect(globalsCSS).toContain('--brand-primary');
      expect(globalsCSS).toContain('--brand-accent');
      expect(globalsCSS).toContain('--brand-surface');
      expect(globalsCSS).toContain('--brand-surface-alt');
      expect(globalsCSS).toContain('--brand-highlight');
      expect(globalsCSS).toContain('--brand-primary-mid');
    });

    it('should set Navy/Gold/Cream values for Yong brand', () => {
      expect(globalsCSS).toContain('#0C1C2E');
      expect(globalsCSS).toContain('#BFA67A');
      expect(globalsCSS).toContain('#F9F8F6');
    });

    it('should import Playfair Display and Inter fonts', () => {
      expect(globalsCSS).toContain('Playfair+Display');
      expect(globalsCSS).toContain('Inter');
    });
  });
});
