import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const globalsPath = path.resolve(__dirname, '../app/globals.css');
const globalsCSS = fs.readFileSync(globalsPath, 'utf8');

describe('Tailwind v4 Design Tokens (CSS-first)', () => {
  describe('Colors', () => {
    it('should define all brand color tokens in @theme', () => {
      expect(globalsCSS).toContain('--color-navy:');
      expect(globalsCSS).toContain('--color-gold:');
      expect(globalsCSS).toContain('--color-cream:');
      expect(globalsCSS).toContain('--color-cream-alt:');
      expect(globalsCSS).toContain('--color-accent:');
      expect(globalsCSS).toContain('--color-navy-mid:');
    });

    it('should use correct hex values from DESIGN_SYSTEM.md', () => {
      expect(globalsCSS).toContain('#0C1C2E');
      expect(globalsCSS).toContain('#BFA67A');
      expect(globalsCSS).toContain('#F9F8F6');
      expect(globalsCSS).toContain('#F5F5F0');
      expect(globalsCSS).toContain('#E07A5F');
      expect(globalsCSS).toContain('#162a42');
    });
  });

  describe('Typography', () => {
    it('should define all custom font sizes in @theme', () => {
      const sizes = ['--text-3xs:', '--text-2xs:', '--text-meta:', '--text-label:', '--text-tab:', '--text-body-lg:', '--text-narrative:'];
      for (const size of sizes) {
        expect(globalsCSS).toContain(size);
      }
    });

    it('should define serif and sans font families', () => {
      expect(globalsCSS).toContain('--font-serif:');
      expect(globalsCSS).toContain('--font-sans:');
      expect(globalsCSS).toContain('Playfair Display');
      expect(globalsCSS).toContain('Inter');
    });

    it('should define custom tracking values', () => {
      const tracking = ['--tracking-xs:', '--tracking-sm:', '--tracking-md:', '--tracking-lg:', '--tracking-xl:'];
      for (const t of tracking) {
        expect(globalsCSS).toContain(t);
      }
    });
  });

  describe('Layout', () => {
    it('should define all content max-widths as @utility', () => {
      expect(globalsCSS).toContain('max-w-narrow');
      expect(globalsCSS).toContain('max-w-content-sm');
      expect(globalsCSS).toContain('max-w-content-lg');
      expect(globalsCSS).toContain('max-w-content-xl');
    });

    it('should use correct max-width values', () => {
      expect(globalsCSS).toContain('1600px');
      expect(globalsCSS).toContain('1800px');
    });
  });

  describe('Shadows', () => {
    it('should define shadow-card in @theme', () => {
      expect(globalsCSS).toContain('--shadow-card:');
    });

    it('should define shadow-marker in @theme', () => {
      expect(globalsCSS).toContain('--shadow-marker:');
    });
  });

  describe('Z-Index', () => {
    it('should define all z-index tokens as @utility', () => {
      const required = ['z-base', 'z-overlay', 'z-float', 'z-popup', 'z-nav'];
      for (const z of required) {
        expect(globalsCSS).toContain(z);
      }
    });
  });

  describe('Animations', () => {
    it('should define all animation utilities in @theme', () => {
      const required = ['--animate-fadeIn:', '--animate-slide-up:', '--animate-fade-in:', '--animate-fade-in-up:', '--animate-float:'];
      for (const a of required) {
        expect(globalsCSS).toContain(a);
      }
    });

    it('should define all keyframes', () => {
      const required = ['@keyframes fadeIn', '@keyframes fadeSlideIn', '@keyframes slideUp', '@keyframes fadeInUp', '@keyframes float', '@keyframes fade-in'];
      for (const k of required) {
        expect(globalsCSS).toContain(k);
      }
    });
  });

  describe('globals.css structure', () => {
    it('should use Tailwind v4 @import syntax', () => {
      expect(globalsCSS).toContain('@import "tailwindcss"');
    });

    it('should NOT use v3 @tailwind directives', () => {
      expect(globalsCSS).not.toContain('@tailwind base');
      expect(globalsCSS).not.toContain('@tailwind components');
      expect(globalsCSS).not.toContain('@tailwind utilities');
    });

    it('should source @platform/ui components', () => {
      expect(globalsCSS).toContain('@source');
      expect(globalsCSS).toContain('packages/ui/src');
    });

    it('should define brand CSS variables for per-agent theming', () => {
      expect(globalsCSS).toContain('--brand-primary');
      expect(globalsCSS).toContain('--brand-accent');
      expect(globalsCSS).toContain('--brand-surface');
      expect(globalsCSS).toContain('--brand-surface-alt');
      expect(globalsCSS).toContain('--brand-highlight');
      expect(globalsCSS).toContain('--brand-primary-mid');
    });
  });
});
