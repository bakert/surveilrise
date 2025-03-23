import { NextRequest, NextResponse } from "next/server";
import { SearchService, type SearchResult } from "./search.service";

export const dynamic = "force-dynamic";

/**
 * @api {get} /api/search Search for cards
 * @apiName SearchCards
 * @apiGroup Cards
 * @apiVersion 1.0.0
 *
 * @apiQuery {String} q Search query string (e.g., 'type:creature cmc:3')
 * @apiQuery {Number} [page=1] Page number for pagination
 *
 * @apiSuccess {Object[]} cards List of cards matching the search criteria
 * @apiSuccess {String} cards.id Card's Oracle ID
 * @apiSuccess {String} cards.name Card name
 * @apiSuccess {String|null} cards.imgUrl URL to card image
 * @apiSuccess {Number} total Total number of cards matching the search criteria
 *
 * @apiError {Object} 400 Missing or invalid query parameter
 * @apiError {Object} 500 Internal server error
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<SearchResult | { error: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");

    if (!query) {
      return NextResponse.json(
        { error: "Missing query parameter" },
        { status: 400 }
      );
    }

    const result = await SearchService.search({ query, page });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process search query",
      },
      {
        status:
          error instanceof Error && error.message === "Missing query parameter"
            ? 400
            : 500,
      }
    );
  }
}
