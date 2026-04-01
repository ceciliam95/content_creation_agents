import { NextRequest, NextResponse } from "next/server";
import {
  buildWechatArticlesRequest,
  type WechatApiResponse
} from "@/lib/wechat-monitor";
import {
  formatMonitorRequestError,
  formatMonitorStatusError
} from "@/lib/search-feedback";
import { saveWechatSearchResult } from "@/lib/search-history";

const endpoint = "http://cn8n.com/p4/fbmain/monitor/v3/kw_search";

export async function GET(request: NextRequest) {
  const apiKey = process.env.WECHAT_MONITOR_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { message: "Missing WECHAT_MONITOR_API_KEY." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("kw")?.trim() || "网文出海";
  const page = Number(searchParams.get("page") || "1");
  const period = Number(searchParams.get("period") || "7");

  const payload = buildWechatArticlesRequest(keyword, { page, period });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: formatMonitorStatusError("wechat", response.status) },
        { status: response.status }
      );
    }

    const data = (await response.json()) as WechatApiResponse;

    if (data.code !== 0) {
      return NextResponse.json(
        { message: data.msg || "Wechat monitor API returned an error." },
        { status: 502 }
      );
    }

    const saved = await saveWechatSearchResult({
      keyword,
      status: "success",
      response: data
    });

    return NextResponse.json({
      searchId: saved.searchId,
      keyword,
      sourceType: "wechat",
      total: saved.total,
      page: saved.page,
      totalPages: saved.totalPages,
      days: saved.days
    });
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Unexpected request error.";
    const message = formatMonitorRequestError("wechat", rawMessage);

    return NextResponse.json({ message }, { status: 500 });
  }
}
