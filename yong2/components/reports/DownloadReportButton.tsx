'use client';

export function DownloadReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-3 caps text-stone border border-[color:var(--hairline)] px-5 py-3 hover:border-[color:var(--gold)] hover:text-gold transition-colors no-print"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M12 3v13m0 0l-5-5m5 5l5-5M3 21h18" strokeLinecap="round" />
      </svg>
      Download PDF
    </button>
  );
}
