import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "database";
import type {
  Card as PrismaCard,
  Printing,
  PrismaClient,
  Legality,
} from "@prisma/client";

interface PageProps {
  params: {
    id: string;
  };
}

interface CardDetails {
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
  artist: string;
  legalities: Array<{
    format: string;
    legal: boolean;
  }>;
  printings: Array<{
    setCode: string;
    rarity: string;
    usd: number | null;
    eur: number | null;
    tix: number | null;
    artist: string;
  }>;
}

type CardWithPrintingsAndLegalities = PrismaCard & {
  printings: Printing[];
  legalities: Legality[];
};

const typedPrisma = prisma as PrismaClient;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const card = await getCardDetails(params.id);

  if (!card) {
    return {
      title: "Card Not Found - Surveilrise",
      description: "The requested card could not be found.",
    };
  }

  return {
    title: `${card.name} - Surveilrise`,
    description: `${card.name} (${card.setName}) - ${card.type}`,
  };
}

async function getCardDetails(id: string): Promise<CardDetails | null> {
  try {
    const card = (await typedPrisma.card.findUnique({
      where: {
        oracleId: id,
      },
      include: {
        printings: {
          orderBy: {
            releasedAt: "desc",
          },
        },
        legalities: true,
      },
    })) as CardWithPrintingsAndLegalities | null;

    if (!card) {
      return null;
    }

    const latestPrinting = card.printings[0];

    return {
      id: card.oracleId,
      name: card.name,
      imgUrl: latestPrinting?.imageUrl || "",
      manaCost: card.manaCost || "",
      type: card.typeLine,
      oracleText: card.oracleText || "",
      colors: card.colors || [],
      rarity: latestPrinting?.rarity || "",
      set: latestPrinting?.setCode || "",
      setName: latestPrinting?.setCode || "",
      collectorNumber: latestPrinting?.collectorNumber || "",
      artist: latestPrinting?.artist || "Unknown",
      legalities: card.legalities.map((l) => ({
        format: l.format,
        legal: l.legal,
      })),
      printings: card.printings.map((p) => ({
        setCode: p.setCode,
        rarity: p.rarity,
        usd: p.usd ? Number(p.usd) : null,
        eur: p.eur ? Number(p.eur) : null,
        tix: p.tix ? Number(p.tix) : null,
        artist: p.artist || "Unknown",
      })),
    };
  } catch (error) {
    console.error("Error fetching card:", error);
    return null;
  }
}

export default async function CardPage({
  params,
}: PageProps): Promise<JSX.Element> {
  const card = await getCardDetails(params.id);

  if (!card) {
    notFound();
  }

  const formatLegalities = card.legalities.reduce(
    (acc, { format, legal }) => {
      acc[legal ? "legal" : "not_legal"].push(format);
      return acc;
    },
    { legal: [] as string[], not_legal: [] as string[] }
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold text-white">
                  {card.name}
                </CardTitle>
                <div className="text-2xl text-gray-300">{card.manaCost}</div>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <span>{card.type}</span>
                <Separator orientation="vertical" className="h-4 bg-gray-700" />
                <span className="capitalize">{card.rarity}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card Image */}
                <div className="space-y-4">
                  <div className="relative aspect-[2.5/3.5]">
                    {card.imgUrl ? (
                      <Image
                        src={card.imgUrl}
                        alt={card.name}
                        fill
                        className="object-contain rounded-lg"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center p-4">
                        <span className="text-gray-400 text-sm text-center">
                          No image found
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm text-center">
                    Illustrated by {card.artist}
                  </div>
                </div>

                {/* Card Details */}
                <div className="space-y-6">
                  {/* Colors */}
                  <div className="flex flex-wrap gap-2">
                    {card.colors.map((color) => (
                      <Badge
                        key={color}
                        variant="secondary"
                        className="bg-gray-700 text-gray-300 hover:bg-gray-600"
                      >
                        {color}
                      </Badge>
                    ))}
                  </div>

                  {/* Oracle Text */}
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 whitespace-pre-line">
                      {card.oracleText}
                    </p>
                  </div>

                  {/* Format Legalities */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Format Legalities
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-400 mb-2">
                          Legal in:
                        </h4>
                        <div className="space-y-1">
                          {formatLegalities.legal.map((format) => (
                            <Badge
                              key={format}
                              variant="secondary"
                              className="bg-green-900/30 text-green-400 border-green-900 mr-2 mb-2"
                            >
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-400 mb-2">
                          Not legal in:
                        </h4>
                        <div className="space-y-1">
                          {formatLegalities.not_legal.map((format) => (
                            <Badge
                              key={format}
                              variant="secondary"
                              className="bg-red-900/30 text-red-400 border-red-900 mr-2 mb-2"
                            >
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Printings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Printings
                    </h3>
                    <div className="space-y-4">
                      {card.printings.map((printing) => (
                        <div
                          key={`${printing.setCode}-${printing.artist}`}
                          className="bg-gray-700/50 rounded-lg p-4 space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-white font-medium">
                                {printing.setCode} - {printing.rarity}
                              </div>
                              <div className="text-sm text-gray-400">
                                Illustrated by {printing.artist}
                              </div>
                            </div>
                            <div className="text-right">
                              {printing.usd && (
                                <div className="text-green-400">
                                  ${printing.usd.toFixed(2)} USD
                                </div>
                              )}
                              {printing.eur && (
                                <div className="text-blue-400">
                                  €{printing.eur.toFixed(2)} EUR
                                </div>
                              )}
                              {printing.tix && (
                                <div className="text-purple-400">
                                  {printing.tix.toFixed(2)} TIX
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
