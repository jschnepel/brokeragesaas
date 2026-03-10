"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSSE } from "@/hooks/use-sse";
import type { SSEPayload, SSEEvent } from "@/lib/sse/events";

interface SSEProviderProps {
  children: React.ReactNode;
}

export function SSEProvider({ children }: SSEProviderProps) {
  const router = useRouter();

  useSSE({
    onEvent: (event: SSEPayload) => {
      if (event.type === "heartbeat") return;

      const sseEvent = event as SSEEvent;

      toast(sseEvent.message, {
        duration: 5000,
        action: {
          label: "View",
          onClick: () => router.push(sseEvent.href),
        },
      });

      // Refresh server data so tables/queues update
      router.refresh();
    },
  });

  return <>{children}</>;
}
