'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  brokerage_name: string;
  logo_url: string;
  brand_colors: {
    primary: string;
    secondary: string;
  };
  features: Record<string, unknown>;
}

const AgentContext = createContext<Agent | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAgent() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const agentId = process.env.NEXT_PUBLIC_AGENT_ID;

        const response = await fetch(`${apiUrl}/api/agents`, {
          headers: {
            'x-agent-id': agentId || '',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch agent config');
        }

        const data = await response.json();
        setAgent(data.agent);

        // Apply brand colors to CSS variables
        if (data.agent?.brand_colors) {
          applyBrandColors(data.agent.brand_colors);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-secondary-600">Agent not found</div>
      </div>
    );
  }

  return (
    <AgentContext.Provider value={agent}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
}

function applyBrandColors(colors: { primary: string; secondary: string }) {
  const root = document.documentElement;

  if (colors.primary) {
    const primaryColors = generateColorPalette(colors.primary);
    Object.entries(primaryColors).forEach(([shade, value]) => {
      root.style.setProperty(`--color-primary-${shade}`, value);
    });
  }

  if (colors.secondary) {
    const secondaryColors = generateColorPalette(colors.secondary);
    Object.entries(secondaryColors).forEach(([shade, value]) => {
      root.style.setProperty(`--color-secondary-${shade}`, value);
    });
  }
}

function generateColorPalette(baseColor: string): Record<string, string> {
  // Simple palette generation - in production, use a proper color library
  return {
    '50': baseColor,
    '100': baseColor,
    '200': baseColor,
    '300': baseColor,
    '400': baseColor,
    '500': baseColor,
    '600': baseColor,
    '700': baseColor,
    '800': baseColor,
    '900': baseColor,
  };
}
