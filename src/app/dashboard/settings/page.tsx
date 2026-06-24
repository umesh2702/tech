import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WhatsAppSettings } from "./whatsapp-settings";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  let prefs = await prisma.userPreference.findUnique({
    where: { userId: session.user.id }
  });

  if (!prefs) {
    prefs = await prisma.userPreference.create({
      data: { userId: session.user.id }
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and delivery settings.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">WhatsApp Delivery</h2>
        <WhatsAppSettings 
          initialPhone={prefs.whatsappNumber || ""} 
          isVerified={prefs.whatsappVerified} 
        />
      </div>
    </div>
  );
}
