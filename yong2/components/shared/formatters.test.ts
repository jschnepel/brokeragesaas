import { describe, it, expect } from 'vitest';
import { formatPrice, formatSqft, formatAcres, formatDom, formatBeds, formatBaths, slugify } from './formatters';

describe('formatters', () => {
  describe('formatPrice', () => {
    it('formats whole millions with commas and dollar sign', () => {
      expect(formatPrice(8495000)).toBe('$8,495,000');
    });
    it('returns "Price Upon Request" when price is null or 0', () => {
      expect(formatPrice(null)).toBe('Price Upon Request');
      expect(formatPrice(0)).toBe('Price Upon Request');
    });
  });

  describe('formatSqft', () => {
    it('formats square footage with commas and sf suffix', () => {
      expect(formatSqft(7842)).toBe('7,842 sf');
    });
    it('returns em dash for null', () => {
      expect(formatSqft(null)).toBe('—');
    });
  });

  describe('formatAcres', () => {
    it('formats with one decimal and ac suffix', () => {
      expect(formatAcres(1.8)).toBe('1.8 ac');
    });
  });

  describe('formatDom', () => {
    it('rounds to whole number', () => {
      expect(formatDom(112.4)).toBe('112');
    });
  });

  describe('formatBeds', () => {
    it('formats bed count with bd suffix', () => {
      expect(formatBeds(5)).toBe('5 bd');
    });
    it('returns em dash for null', () => {
      expect(formatBeds(null)).toBe('—');
    });
  });

  describe('formatBaths', () => {
    it('formats integer baths without decimal', () => {
      expect(formatBaths(6)).toBe('6 ba');
    });
    it('formats half baths with decimal', () => {
      expect(formatBaths(5.5)).toBe('5.5 ba');
    });
    it('returns em dash for null', () => {
      expect(formatBaths(null)).toBe('—');
    });
  });

  describe('slugify', () => {
    it('lowercases and replaces spaces with hyphens', () => {
      expect(slugify('Desert Mountain')).toBe('desert-mountain');
    });
    it('strips non-alphanumeric except hyphens', () => {
      expect(slugify("Yong's Estate #1")).toBe('yongs-estate-1');
    });
  });
});
