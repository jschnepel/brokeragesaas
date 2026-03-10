import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  switch (role) {
    case "agent":
      redirect("/requests");
    case "marketing_manager":
      redirect("/triage");
    case "designer":
      redirect("/queue");
    case "executive":
      redirect("/reports");
    default:
      redirect("/requests");
  }
}
