import { prisma } from "@/lib/prisma";

export async function isDuplicate(url: string, title: string): Promise<boolean> {
  // 1. Exact URL Match
  const exactUrlMatch = await prisma.intelligenceItem.findUnique({
    where: { sourceUrl: url },
    select: { id: true }
  });
  
  if (exactUrlMatch) return true;

  // 2. Exact Title Match (within the last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const exactTitleMatch = await prisma.intelligenceItem.findFirst({
    where: {
      title: title,
      createdAt: { gte: sevenDaysAgo }
    },
    select: { id: true }
  });

  if (exactTitleMatch) return true;

  return false;
}
