import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRequests, getKPIs } from "@/actions/intake";
import { RequestsClient } from "./RequestsClient";

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;
  const [requests, kpis] = await Promise.all([
    getRequests({ requesterId: userId }),
    getKPIs(),
  ]);

  return (
    <RequestsClient
      requests={requests}
      kpis={kpis}
      currentUserId={userId}
    />
  );
}
