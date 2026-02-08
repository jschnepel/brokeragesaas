'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = 'left',
  className = '',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  href,
  disabled = false,
  className = '',
}: DropdownItemProps) {
  const baseClassName = `block w-full text-left px-4 py-2 text-sm ${
    disabled
      ? 'text-secondary-400 cursor-not-allowed'
      : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
  } ${className}`;

  if (href && !disabled) {
    return (
      <a href={href} className={baseClassName} role="menuitem">
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={baseClassName}
      role="menuitem"
      disabled={disabled}
    >
      {children}
    </button>
  );
}
