import { NextResponse } from "next/server";
import { prisma } from "database";
import type { Card, Printing, PrismaClient } from "@prisma/client";

interface CardResponse {
  id: string;
  name: string;
  imgUrl: string;
  manaCost: string;
  type: string;
  oracleText: string;
  colors: string[];
  rarity: string;
  set: string;
  setName: string;
  collectorNumber: string;
}

type CardWithPrintings = Card & {
  printings: Printing[];
};

const typedPrisma = prisma as PrismaClient;

/**
 * @api {get} /api/cards/:id Get card details
 * @apiName GetCard
 * @apiGroup Cards
 * @apiVersion 1.0.0
 *
 * @apiParam {String} id Card's Oracle ID
 *
 * @apiSuccess {String} id Card's Oracle ID
 * @apiSuccess {String} name Card name
 * @apiSuccess {String} imgUrl URL to card image
 * @apiSuccess {String} manaCost Card's mana cost
 * @apiSuccess {String} type Card type line
 * @apiSuccess {String} oracleText Card's oracle text
 * @apiSuccess {String[]} colors Card's colors
 * @apiSuccess {String} rarity Card's rarity
 * @apiSuccess {String} set Card's set code
 * @apiSuccess {String} setName Card's set name
 * @apiSuccess {String} collectorNumber Card's collector number
 *
 * @apiError {Object} 404 Card not found
 * @apiError {Object} 500 Internal server error
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ error: string } | CardResponse>> {
  try {
    const card = (await typedPrisma.card.findUnique({
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
    })) as CardWithPrintings | null;

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
