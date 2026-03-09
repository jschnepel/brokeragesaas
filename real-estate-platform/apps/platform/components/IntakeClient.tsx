"use client";

import dynamic from "next/dynamic";

const IntakeUI = dynamic(() => import("./IntakeUI"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#9CA3AF",
        fontSize: 14,
      }}
    >
      Loading platform...
    </div>
  ),
});

export default function IntakeClient() {
  return <IntakeUI />;
}
