import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name}
      />
      <main className="flex-1 overflow-auto p-4 pt-[4.5rem] sm:p-6 lg:p-8 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
