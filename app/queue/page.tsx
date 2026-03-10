import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRequests } from "@/actions/intake";
import { QueueClient } from "./QueueClient";

export default async function QueuePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;
  const requests = await getRequests({ assignedTo: userId });

  return <QueueClient requests={requests} currentUserId={userId} />;
}
