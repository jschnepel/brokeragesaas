/**
 * app/intake/page.tsx
 *
 * Brokerage Marketing Operations — Intake Module
 *
 * This is the entry point for the marketing intake system:
 * - Agents submit and track creative requests
 * - Designers manage their queue
 * - Marketing leadership reviews intake, approves, and monitors SLA
 *
 * All data is mocked for the prototype. When ready to wire real data,
 * replace the mock constants in IntakeUI.jsx with server fetches or
 * React Query calls — component structure stays identical.
 *
 * Place at: apps/rlsir/app/intake/page.tsx
 */

import type { Metadata } from "next";
import IntakeClient from "./IntakeClient";

export const metadata: Metadata = {
  title: "Marketing Operations | Russ Lyon Sotheby's",
  description: "Internal marketing request and operations platform.",
  robots: { index: false, follow: false }, // keep out of search engines
};

export default function IntakePage() {
  return <IntakeClient />;
}
