import { auth } from "@/auth";
import { redirect } from "next/navigation";
import IntakeClient from "@/components/IntakeClient";

export default async function QueuePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <IntakeClient />;
}
