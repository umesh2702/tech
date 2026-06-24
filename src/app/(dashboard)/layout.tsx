import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
