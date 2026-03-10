"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { SSEPayload } from "@/lib/sse/events";

interface UseSSEOptions {
  onEvent: (event: SSEPayload) => void;
}

export function useSSE({ onEvent }: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/events/stream");
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      retriesRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data: SSEPayload = JSON.parse(event.data);
        if (data.type !== "heartbeat") {
          onEventRef.current(data);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, then 30s
      const delay = Math.min(1000 * 2 ** retriesRef.current, 30_000);
      retriesRef.current++;
      setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected };
}
