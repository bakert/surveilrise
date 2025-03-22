import { parseSearchQuery } from "search";
import { prisma } from "database";
import { DEFAULT_PAGE_SIZE } from "../../constants";
import type { Card, Printing, Prisma, PrismaClient } from "@prisma/client";

interface TransformedCard {
  id: string;
  name: string;
  imgUrl: string | null;
  debug: {
    rawCard: Card & { printings: Printing[] };
    printings: Printing[];
  };
}

export interface SearchResult {
  query: {
    where: Prisma.CardWhereInput;
    include?: {
      printings: {
        where: Prisma.PrintingWhereInput;
      };
    };
  };
  cards: TransformedCard[];
  total: number;
  debug: {
    whereClause: Prisma.CardWhereInput;
    page: number;
    pageSize: number;
  };
}

export interface SearchParams {
  query: string;
  page: number;
  pageSize?: number;
}

interface ParsedSearchQuery {
  where: Prisma.CardWhereInput;
  include?: {
    printings: {
      where: Prisma.PrintingWhereInput;
    };
  };
}

type CardWithPrintings = Card & {
  printings: Printing[];
};

const typedPrisma = prisma as PrismaClient;

export class SearchService {
  static async search({
    query,
    page,
    pageSize = DEFAULT_PAGE_SIZE,
  }: SearchParams): Promise<SearchResult> {
    if (!query) {
      throw new Error("Missing query parameter");
    }

    const searchQuery = parseSearchQuery(query) as ParsedSearchQuery;
    const whereClause = searchQuery.where;
    const printingsWhere = searchQuery.include?.printings.where;

    const total = await typedPrisma.card.count({
      where: whereClause,
    });

    const prismaQuery = {
      where: whereClause,
      include: {
        printings: {
          where: printingsWhere,
          orderBy: {
            releasedAt: "desc",
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: "asc",
      },
    } as const;

    const cards = (await typedPrisma.card.findMany(
      prismaQuery
    )) as CardWithPrintings[];

    const transformedCards: TransformedCard[] = cards.map((card) => ({
      id: card.oracleId,
      name: card.name,
      imgUrl: card.printings[0]?.imageUrl || null,
      debug: {
        rawCard: card,
        printings: card.printings,
      },
    }));

    return {
      query: searchQuery,
      cards: transformedCards,
      total,
      debug: {
        whereClause,
        page,
        pageSize,
      },
    };
  }
}
