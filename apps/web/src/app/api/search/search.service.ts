import { parseSearchQuery } from 'search';
import { prisma } from 'database';
import { DEFAULT_PAGE_SIZE } from '../../constants';

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
  static async search({ query, page, pageSize = DEFAULT_PAGE_SIZE }: SearchParams): Promise<SearchResult> {
    if (!query) {
      throw new Error('Missing query parameter');
    }

    const searchQuery = parseSearchQuery(query);
    const whereClause = searchQuery.where;
    const printingsWhere = searchQuery.include?.printings.where;

    const total = await prisma.card.count({
      where: whereClause
    });

    const cards = await prisma.card.findMany({
      where: whereClause,
      include: {
        printings: {
          where: printingsWhere,
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

    const transformedCards = cards.map(card => ({
      id: card.oracleId,
      name: card.name,
      imgUrl: card.printings[0]?.imageUrl || null,
      debug: {
        rawCard: card,
        printings: card.printings
      }
    }));

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