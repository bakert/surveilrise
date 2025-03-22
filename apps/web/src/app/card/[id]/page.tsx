import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "database";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

async function getCardDetails(id: string) {
  try {
    const card = await prisma.card.findUnique({
      where: {
        oracleId: id,
      },
      include: {
        printings: {
          orderBy: {
            releasedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!card) {
      return null;
    }

    const latestPrinting = card.printings[0];

    return {
      id: card.oracleId,
      name: card.name,
      imgUrl: latestPrinting?.imageUrl || '',
      manaCost: card.manaCost || '',
      type: card.typeLine,
      oracleText: card.oracleText || '',
      colors: card.colors || [],
      rarity: latestPrinting?.rarity || '',
      set: latestPrinting?.setCode || '',
      setName: latestPrinting?.setCode || '',
      collectorNumber: latestPrinting?.collectorNumber || '',
    };
  } catch (error) {
    console.error('Error fetching card:', error);
    return null;
  }
}

export default async function CardPage({ params }: PageProps) {
  const card = await getCardDetails(params.id);

  if (!card) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold text-white">{card.name}</CardTitle>
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
                <div className="relative aspect-[2.5/3.5]">
                  <Image
                    src={card.imgUrl}
                    alt={card.name}
                    fill
                    className="object-contain rounded-lg"
                    priority
                  />
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
                    <p className="text-gray-300 whitespace-pre-line">{card.oracleText}</p>
                  </div>

                  {/* Set Information */}
                  <div className="pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                      <div>
                        <span className="font-medium">Set:</span>
                        <span className="ml-2">{card.setName}</span>
                      </div>
                      <div>
                        <span className="font-medium">Number:</span>
                        <span className="ml-2">{card.collectorNumber}</span>
                      </div>
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