import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'rlsir_compare_communities';
const MAX_ITEMS = 3;

interface CompareState {
  items: string[];
  isModalOpen: boolean;
  add: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
  openModal: () => void;
  closeModal: () => void;
}

const CompareContext = createContext<CompareState | null>(null);

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed.slice(0, MAX_ITEMS);
    }
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export const CompareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<string[]>(loadFromStorage);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  const add = useCallback((id: string): boolean => {
    let added = false;
    setItems(prev => {
      if (prev.includes(id) || prev.length >= MAX_ITEMS) return prev;
      added = true;
      return [...prev, id];
    });
    return added;
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setIsModalOpen(false);
  }, []);

  const isInCompare = useCallback((id: string) => items.includes(id), [items]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <CompareContext.Provider value={{ items, isModalOpen, add, remove, clear, isInCompare, openModal, closeModal }}>
      {children}
    </CompareContext.Provider>
  );
};

export function useCompare(): CompareState {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
