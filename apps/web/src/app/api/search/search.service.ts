import { parseSearchQuery } from 'search';
import { prisma } from 'database';

export interface SearchResult {
  query: any;
  cards: any[];
  total: number;
}

export interface SearchParams {
  query: string;
  page: number;
  pageSize?: number;
}

export class SearchService {
  private static readonly DEFAULT_PAGE_SIZE = 20;

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

    return {
      query: searchQuery,
      cards,
      total
    };
  }
}