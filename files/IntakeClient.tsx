"use client";

/**
 * IntakeClient.tsx
 *
 * Dynamic wrapper for the intake UI component.
 * Recharts and several browser-only APIs in the intake module
 * will crash on the server — this wrapper ensures the entire
 * component is client-only with no SSR attempt.
 *
 * Place at: apps/rlsir/app/intake/IntakeClient.tsx
 */

import dynamic from "next/dynamic";

const IntakeUI = dynamic(
  () => import("../../components/intake/IntakeUI"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F2B4F",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid rgba(201,169,110,0.2)",
              borderTop: "3px solid #C9A96E",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(201,169,110,0.6)",
            }}
          >
            Loading
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    ),
  }
);

export default function IntakeClient() {
  return <IntakeUI />;
}
