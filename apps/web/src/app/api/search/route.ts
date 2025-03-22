import { NextRequest, NextResponse } from "next/server";
import { SearchService } from "./search.service";

export async function GET(
  request: NextRequest
): Promise<
  NextResponse<{ query: any; cards: any[]; total: number } | { error: string }>
> {
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
