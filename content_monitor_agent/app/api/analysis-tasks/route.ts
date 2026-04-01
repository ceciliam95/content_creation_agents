import { NextRequest, NextResponse } from "next/server";
import { callOpenAiCompatibleJson } from "@/lib/ai-config";
import {
  createAnalysisTask,
  getAnalysisTasksForSearch,
  getTaskSourceItems,
  saveCompletedAnalysisResult
} from "@/lib/analysis-tasks";

type StageOneResult = {
  summary: string;
  keywords: string[];
  keyPoints: string[];
  highlights: string[];
  angles: string[];
  risks: string[];
};

type StageTwoResult = {
  summary: string;
  hotInsights: string;
  suggestions: Array<{
    title: string;
    brief: string;
    whyNow: string;
    entryPoint: string;
    referenceItemIds: string[];
  }>;
};

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function tryFetchFullText(url: string) {
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const text = stripHtml(html);
    return text.length >= 200 ? text : null;
  } catch {
    return null;
  }
}

function buildStageOnePrompt(item: {
  title: string;
  sourceType: "wechat" | "xiaohongshu";
  content: string;
}) {
  return {
    system:
      "You are a content analyst. Return strict JSON with keys: summary, keywords, keyPoints, highlights, angles, risks. Each list must be an array of strings.",
    user: JSON.stringify({
      task: "Analyze one selected article or note for topic ideation.",
      sourceType: item.sourceType,
      title: item.title,
      content: item.content
    })
  };
}

function buildStageTwoPrompt(input: {
  keyword: string;
  sourceType: "wechat" | "xiaohongshu";
  itemSummaries: Array<StageOneResult & { contentItemId: string; title: string }>;
}) {
  return {
    system:
      "You are a senior content strategist. Return strict JSON with keys: summary, hotInsights, suggestions. suggestions must contain at least 5 items. Each suggestion item needs title, brief, whyNow, entryPoint, referenceItemIds.",
    user: JSON.stringify({
      task: "Generate structured topic insights from analyzed content items.",
      keyword: input.keyword,
      sourceType: input.sourceType,
      itemSummaries: input.itemSummaries
    })
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchId = Number(searchParams.get("searchId"));

  if (!searchId) {
    return NextResponse.json({ message: "Missing searchId." }, { status: 400 });
  }

  try {
    const tasks = await getAnalysisTasksForSearch(undefined, searchId);
    return NextResponse.json({ tasks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected analysis task request error.";

    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      searchId: number;
      sourceType: "wechat" | "xiaohongshu";
      keyword: string;
      selectedItems: Array<{
        contentItemId: string;
        contentTitle: string;
        originalUrl?: string;
      }>;
    };

    if (!body.searchId || !body.sourceType || body.selectedItems.length === 0) {
      return NextResponse.json({ message: "Invalid analysis task payload." }, { status: 400 });
    }

    const task = await createAnalysisTask({
      searchId: body.searchId,
      sourceType: body.sourceType,
      selectedItems: body.selectedItems
    });

    const sourceItems = await getTaskSourceItems(
      undefined,
      body.searchId,
      body.sourceType,
      body.selectedItems.map((item) => item.contentItemId)
    );

    const analyzedItems = [];

    for (const item of sourceItems) {
      const fullText = await tryFetchFullText(item.originalUrl);
      const stageOne = await callOpenAiCompatibleJson<StageOneResult>(
        buildStageOnePrompt({
          title: item.title,
          sourceType: body.sourceType,
          content: fullText || item.summary
        })
      );

      analyzedItems.push({
        contentItemId: item.contentItemId,
        title: item.title,
        ...stageOne
      });
    }

    const stageTwo = await callOpenAiCompatibleJson<StageTwoResult>(
      buildStageTwoPrompt({
        keyword: body.keyword,
        sourceType: body.sourceType,
        itemSummaries: analyzedItems
      })
    );

    if (stageTwo.suggestions.length < 5) {
      return NextResponse.json(
        { message: "AI analysis returned fewer than 5 topic suggestions." },
        { status: 502 }
      );
    }

    await saveCompletedAnalysisResult({
      taskId: task.id,
      itemSummaries: analyzedItems.map((item) => ({
        contentItemId: item.contentItemId,
        summary: item.summary,
        keywords: item.keywords,
        keyPoints: item.keyPoints,
        highlights: item.highlights,
        angles: item.angles,
        risks: item.risks
      })),
      report: {
        summary: stageTwo.summary,
        hotInsights: stageTwo.hotInsights,
        suggestions: stageTwo.suggestions.slice(0, 5)
      }
    });

    const tasks = await getAnalysisTasksForSearch(undefined, body.searchId);
    return NextResponse.json({ taskId: task.id, tasks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected analysis task error.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
