import { parseSearchQuery } from 'search';
import { prisma } from 'database';

export interface SearchResult {
  query: any;
  cards: any[];
  total: number;
  debug: {
    whereClause: any;
    page: number;
    pageSize: number;
  };
}

export interface SearchParams {
  query: string;
  page: number;
  pageSize?: number;
}

export class SearchService {
  private static readonly DEFAULT_PAGE_SIZE = 60; // 60 has 1,2, 3, 4, 5 and 6 as factors which means we get an even display up to 6 cards wide.

  static async search({ query, page, pageSize = this.DEFAULT_PAGE_SIZE }: SearchParams): Promise<SearchResult> {
    if (!query) {
      throw new Error('Missing query parameter');
    }

    const searchQuery = parseSearchQuery(query);
    const whereClause = searchQuery.where;

    // Get total count for pagination
    const total = await prisma.card.count({
      where: whereClause
    });

    // Search for cards with their printings
    const cards = await prisma.card.findMany({
      where: whereClause,
      include: {
        printings: {
          orderBy: {
            releasedAt: 'desc'
          }
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Found cards:', cards);

    // Transform cards to include imgUrl from first printing
    const transformedCards = cards.map(card => ({
      id: card.oracleId,
      name: card.name,
      imgUrl: card.printings[0]?.imageUrl || null,
      debug: {
        rawCard: card,
        printings: card.printings
      }
    }));

    console.log('Transformed cards:', transformedCards);

    return {
      query: searchQuery,
      cards: transformedCards,
      total,
      debug: {
        whereClause,
        page,
        pageSize
      }
    };
  }
}