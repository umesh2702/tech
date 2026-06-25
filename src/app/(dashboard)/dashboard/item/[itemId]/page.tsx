import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IntelligenceCard } from "@/components/dashboard/intelligence-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ itemId: string }>;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { itemId } = await params;

  const item = await prisma.intelligenceItem.findUnique({
    where: { id: itemId },
    include: { scores: true }
  });

  if (!item) {
    notFound();
  }

  // Map Prisma object to the IntelligenceItem interface expected by IntelligenceCard
  const formattedItem = {
    ...item,
    publishedAt: item.publishedAt.toISOString(),
    collectedAt: item.collectedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    // scores mapping
    scores: item.scores.map(s => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      metadata: s.metadata ? (s.metadata as any) : null
    }))
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link 
          href="/feed"
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Feed
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Intelligence Opportunity</h1>
        <p className="text-muted-foreground">
          Detailed analysis and founder opportunity scoring for this item.
        </p>
      </div>

      <div className="mt-6">
        <IntelligenceCard item={formattedItem as any} />
      </div>
    </div>
  );
}
