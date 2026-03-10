import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTheme, getAllThemes } from "@/actions/theme"
import { ComponentLibraryClient } from "./ComponentLibraryClient"

export default async function ComponentLibraryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role
  if (role !== "marketing_manager" && role !== "designer" && role !== "platform_admin") {
    redirect("/requests")
  }

  const [theme, allThemes] = await Promise.all([getTheme(), getAllThemes()])
  return <ComponentLibraryClient currentTheme={theme} allThemes={allThemes} />
}
