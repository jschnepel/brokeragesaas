"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { scaleIn } from "@/lib/motion";
import { cancelRequest } from "@/actions/intake";

interface CancelModalProps {
  open: boolean;
  requestId: string;
  onClose: () => void;
  onCancelled?: () => void;
}

export function CancelModal({ open, requestId, onClose, onCancelled }: CancelModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await cancelRequest(requestId);
      onCancelled?.();
      onClose();
    } catch (err) {
      console.error("Failed to cancel request:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
            {...scaleIn}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="size-6 text-red-600" />
              </div>

              <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
                Cancel Request?
              </h2>
              <p className="mb-6 text-sm text-[var(--muted)]">
                Are you sure you want to cancel this request? This action cannot be undone.
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)]/50 disabled:opacity-50"
                >
                  Keep It
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
