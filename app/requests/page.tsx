import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: "var(--brand-font-display)", fontSize: 32 }}>
        My Requests
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginTop: 8 }}>
        Welcome, {session.user.name}. Agent dashboard coming soon.
      </p>
    </div>
  );
}
