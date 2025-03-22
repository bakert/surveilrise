import { NextResponse } from "next/server";
import { prisma } from "database";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const card = await prisma.card.findUnique({
      where: {
        oracleId: params.id,
      },
      include: {
        printings: {
          orderBy: {
            releasedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const latestPrinting = card.printings[0];

    return NextResponse.json({
      id: card.oracleId,
      name: card.name,
      imgUrl: latestPrinting?.imageUrl || "",
      manaCost: card.manaCost || "",
      type: card.typeLine,
      oracleText: card.oracleText || "",
      colors: card.colors || [],
      rarity: latestPrinting?.rarity || "",
      set: latestPrinting?.setCode || "",
      setName: latestPrinting?.setCode || "", // We'll need to add a set name lookup if needed
      collectorNumber: latestPrinting?.collectorNumber || "",
    });
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
