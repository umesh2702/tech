import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Query onboarding Completed status from direct DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true, role: true },
  });

  if (!user || !user.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar role={user.role} />
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
