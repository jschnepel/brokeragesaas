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
      break;
    case "marketing_manager":
      redirect("/triage");
      break;
    // designer role not yet in PlatformRole — future addition
    case "executive":
      redirect("/reports");
      break;
    default:
      redirect("/requests");
  }
}
