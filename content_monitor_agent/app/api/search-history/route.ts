import { NextRequest, NextResponse } from "next/server";
import {
  getRecentSearchHistory,
  getSearchDetail
} from "@/lib/search-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const detail = await getSearchDetail(undefined, Number(id));

      if (!detail) {
        return NextResponse.json(
          { message: "Search history record not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(detail);
    }

    const history = await getRecentSearchHistory();
    return NextResponse.json({ history });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected history request error.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
