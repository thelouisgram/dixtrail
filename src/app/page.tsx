import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user?.id && session.user.role) {
    redirect("/dashboard");
  }
  redirect("/login");
}
