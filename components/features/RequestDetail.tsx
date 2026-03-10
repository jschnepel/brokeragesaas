"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, User, Calendar, FileText, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { StatusBadge, RushBadge, SLAIndicator } from "@/components/primitives";
import { ChatThread } from "./ChatThread";
import type { RequestDTO } from "@/lib/types";

function formatDate(date: string | null): string {
  if (!date) return "---";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatQueueNumber(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}

interface RequestDetailProps {
  request: RequestDTO | null;
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function RequestDetail({ request, open, onClose, currentUserId }: RequestDetailProps) {
  return (
    <AnimatePresence>
      {open && request && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl"
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={spring}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-[var(--muted)] mb-0.5">
                  {formatQueueNumber(request.queueNumber)}
                </p>
                <h2 className="truncate text-lg font-semibold text-[var(--foreground)]">
                  {request.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="ml-3 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--border)] transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body (scrollable) */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4 border-b border-[var(--border)] px-5 py-4">
                <MetaItem
                  icon={<Layers className="size-3.5" />}
                  label="Type"
                  value={request.materialType}
                />
                <MetaItem
                  icon={<User className="size-3.5" />}
                  label="Requester"
                  value={request.requesterName}
                />
                <MetaItem
                  icon={<UserCheck className="size-3.5" />}
                  label="Designer"
                  value={request.designerName ?? "Unassigned"}
                />
                <MetaItem
                  icon={<Calendar className="size-3.5" />}
                  label="Due Date"
                  value={formatDate(request.dueDate)}
                />
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={request.status} />
                    <RushBadge isRush={request.isRush} />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                    SLA
                  </p>
                  <SLAIndicator
                    deadline={request.slaDeadline}
                    breached={request.slaBreached}
                  />
                </div>
              </div>

              {/* Brief */}
              {request.brief && (
                <div className="border-b border-[var(--border)] px-5 py-4">
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                    Brief
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-[var(--foreground)] leading-relaxed">
                    {request.brief}
                  </p>
                </div>
              )}

              {/* Files */}
              {request.files.length > 0 && (
                <div className="border-b border-[var(--border)] px-5 py-4">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                    Files
                  </p>
                  <ul className="space-y-1.5">
                    {request.files.map((file) => (
                      <li key={file.id} className="flex items-center gap-2 text-sm">
                        <FileText className="size-3.5 text-[var(--muted)]" />
                        {file.url ? (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent)] hover:underline truncate"
                          >
                            {file.fileName}
                          </a>
                        ) : (
                          <span className="text-[var(--foreground)] truncate">
                            {file.fileName}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="h-[300px] border-t border-[var(--border)]">
              <ChatThread
                requestId={request.id}
                currentUserId={currentUserId}
                className="h-full"
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <span className={cn("inline-flex items-center gap-1.5 text-sm text-[var(--foreground)]")}>
        {icon}
        {value}
      </span>
    </div>
  );
}
