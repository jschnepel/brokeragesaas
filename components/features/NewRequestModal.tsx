"use client";

import { useState, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/lib/motion";
import { MATERIAL_TYPES } from "@/lib/constants";
import { createRequest } from "@/actions/intake";
import type { RequestDTO } from "@/lib/types";

interface NewRequestModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (req: RequestDTO) => void;
}

export function NewRequestModal({ open, onClose, onCreated }: NewRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [materialType, setMaterialType] = useState<string>(MATERIAL_TYPES[0]);
  const [dueDate, setDueDate] = useState("");
  const [isRush, setIsRush] = useState(false);
  const [brief, setBrief] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = useCallback(() => {
    setTitle("");
    setMaterialType(MATERIAL_TYPES[0]);
    setDueDate("");
    setIsRush(false);
    setBrief("");
    setNotes("");
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const req = await createRequest({
        title: title.trim(),
        material_type: materialType,
        due_date: dueDate || undefined,
        is_rush: isRush,
        brief: [brief, notes].filter(Boolean).join("\n\n---\n\n") || undefined,
      });
      resetForm();
      onCreated?.(req);
      onClose();
    } catch (err) {
      console.error("Failed to create request:", err);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]";

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
            className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
            {...scaleIn}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                New Request
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--border)] transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Spring Open House Flyer"
                />
              </div>

              {/* Material type + due date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                    Material Type
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className={inputClass}
                  >
                    {MATERIAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Rush */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRush}
                  onChange={(e) => setIsRush(e.target.checked)}
                  className="size-4 rounded border-[var(--border)] accent-[var(--accent)]"
                />
                <span className="font-medium text-[var(--foreground)]">Rush request</span>
                <span className="text-xs text-[var(--muted)]">(24hr SLA)</span>
              </label>

              {/* Brief */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                  Brief
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                  placeholder="Describe what you need..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={cn(inputClass, "resize-none")}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
