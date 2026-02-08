'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAgent } from '@/lib/agent-context';

export function Navigation() {
  const agent = useAgent();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/properties', label: 'Properties' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="bg-white border-b border-secondary-200">
      <nav className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {agent.logo_url ? (
              <img src={agent.logo_url} alt={agent.name} className="h-8 w-auto" />
            ) : (
              <span className="text-xl font-bold text-secondary-900">{agent.name}</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-secondary-700 hover:text-primary-600"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact Button */}
          <div className="hidden md:block">
            <a
              href={`tel:${agent.phone}`}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
            >
              {agent.phone}
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden -m-2.5 p-2.5 text-secondary-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-200">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-base font-medium text-secondary-700 hover:bg-secondary-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-3 pt-4">
                <a
                  href={`tel:${agent.phone}`}
                  className="block w-full text-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
                >
                  Call {agent.phone}
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
