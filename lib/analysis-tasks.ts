import { getInitializedDatabase } from "@/lib/db";

type CreateAnalysisTaskInput = {
  dbPath?: string;
  searchId: number;
  sourceType: "wechat" | "xiaohongshu";
  selectedItems: Array<{
    contentItemId: string;
    contentTitle: string;
    originalUrl?: string;
  }>;
};

type SaveCompletedAnalysisResultInput = {
  dbPath?: string;
  taskId: number;
  itemSummaries: Array<{
    contentItemId: string;
    summary: string;
    keywords: string[];
    keyPoints: string[];
    highlights: string[];
    angles: string[];
    risks: string[];
  }>;
  report: {
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
};

type AnalysisTaskRow = {
  id: number;
  search_id: number;
  source_type: "wechat" | "xiaohongshu";
  status: "running" | "completed" | "failed" | "pending";
  selected_count: number;
  created_at: string;
  updated_at: string;
};

type AnalysisTaskItemRow = {
  id: number;
  task_id: number;
  content_source_type: string;
  content_item_id: string;
  content_title: string;
  original_url: string;
  full_text_status: string;
  created_at: string;
};

type AnalysisItemSummaryRow = {
  task_item_id: number;
  summary: string;
  keywords_json: string;
  key_points_json: string;
  highlights_json: string;
  angles_json: string;
  risks_json: string;
};

type TopicSuggestionRow = {
  title: string;
  brief: string;
  why_now: string;
  entry_point: string;
  reference_items_json: string;
};

export async function createAnalysisTask({
  dbPath,
  searchId,
  sourceType,
  selectedItems
}: CreateAnalysisTaskInput) {
  const db = await getInitializedDatabase(dbPath);
  const now = new Date().toISOString();

  try {
    await db.exec("BEGIN");

    const task = await db.run(
      `
        INSERT INTO analysis_tasks (
          search_id,
          source_type,
          status,
          selected_count,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [searchId, sourceType, "running", selectedItems.length, now, now]
    );

    const taskId = Number(task.lastID);
    const items: Array<{
      id: number;
      contentItemId: string;
      contentTitle: string;
      originalUrl: string;
      fullTextStatus: string;
    }> = [];

    for (const item of selectedItems) {
      const saved = await db.run(
        `
          INSERT INTO analysis_task_items (
            task_id,
            content_source_type,
            content_item_id,
            content_title,
            original_url,
            full_text_status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          taskId,
          sourceType,
          item.contentItemId,
          item.contentTitle,
          item.originalUrl ?? "",
          "pending",
          now
        ]
      );

      items.push({
        id: Number(saved.lastID),
        contentItemId: item.contentItemId,
        contentTitle: item.contentTitle,
        originalUrl: item.originalUrl ?? "",
        fullTextStatus: "pending"
      });
    }

    await db.exec("COMMIT");

    return {
      id: taskId,
      searchId,
      sourceType,
      status: "running" as const,
      selectedCount: selectedItems.length,
      createdAt: now,
      updatedAt: now,
      items
    };
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  } finally {
    await db.close();
  }
}

export async function saveCompletedAnalysisResult({
  dbPath,
  taskId,
  itemSummaries,
  report
}: SaveCompletedAnalysisResultInput) {
  const db = await getInitializedDatabase(dbPath);
  const now = new Date().toISOString();

  try {
    await db.exec("BEGIN");

    for (const item of itemSummaries) {
      const taskItem = await db.get<AnalysisTaskItemRow>(
        `
          SELECT *
          FROM analysis_task_items
          WHERE task_id = ? AND content_item_id = ?
        `,
        [taskId, item.contentItemId]
      );

      if (!taskItem) {
        throw new Error(`Task item not found for content item ${item.contentItemId}.`);
      }

      await db.run(
        `
          UPDATE analysis_task_items
          SET full_text_status = ?
          WHERE id = ?
        `,
        ["success", taskItem.id]
      );

      await db.run(
        `
          INSERT INTO analysis_item_summaries (
            task_item_id,
            summary,
            keywords_json,
            key_points_json,
            highlights_json,
            angles_json,
            risks_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          taskItem.id,
          item.summary,
          JSON.stringify(item.keywords),
          JSON.stringify(item.keyPoints),
          JSON.stringify(item.highlights),
          JSON.stringify(item.angles),
          JSON.stringify(item.risks),
          now
        ]
      );
    }

    const task = await db.get<AnalysisTaskRow>(
      `
        SELECT *
        FROM analysis_tasks
        WHERE id = ?
      `,
      [taskId]
    );

    if (!task) {
      throw new Error(`Analysis task ${taskId} not found.`);
    }

    const savedReport = await db.run(
      `
        INSERT INTO topic_reports (
          search_id,
          task_id,
          report_status,
          summary,
          hot_insights,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [task.search_id, taskId, "completed", report.summary, report.hotInsights, now, now]
    );

    const reportId = Number(savedReport.lastID);

    for (const suggestion of report.suggestions) {
      await db.run(
        `
          INSERT INTO topic_suggestions (
            report_id,
            title,
            brief,
            why_now,
            entry_point,
            reference_items_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          reportId,
          suggestion.title,
          suggestion.brief,
          suggestion.whyNow,
          suggestion.entryPoint,
          JSON.stringify(suggestion.referenceItemIds),
          now
        ]
      );
    }

    await db.run(
      `
        UPDATE analysis_tasks
        SET status = ?, updated_at = ?
        WHERE id = ?
      `,
      ["completed", now, taskId]
    );

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  } finally {
    await db.close();
  }
}

export async function getAnalysisTasksForSearch(dbPath: string | undefined, searchId: number) {
  const db = await getInitializedDatabase(dbPath);

  try {
    const tasks = await db.all<AnalysisTaskRow[]>(
      `
        SELECT *
        FROM analysis_tasks
        WHERE search_id = ?
        ORDER BY id DESC
      `,
      [searchId]
    );

    const result = [];

    for (const task of tasks) {
      const items = await db.all<AnalysisTaskItemRow[]>(
        `
          SELECT *
          FROM analysis_task_items
          WHERE task_id = ?
          ORDER BY id ASC
        `,
        [task.id]
      );

      const summaries = await db.all<AnalysisItemSummaryRow[]>(
        `
          SELECT s.*
          FROM analysis_item_summaries s
          INNER JOIN analysis_task_items i ON i.id = s.task_item_id
          WHERE i.task_id = ?
          ORDER BY s.id ASC
        `,
        [task.id]
      );

      const report = await db.get<{ id: number; report_status: string; summary: string; hot_insights: string }>(
        `
          SELECT *
          FROM topic_reports
          WHERE task_id = ?
          ORDER BY id DESC
          LIMIT 1
        `,
        [task.id]
      );

      const suggestions = report
        ? await db.all<TopicSuggestionRow[]>(
            `
              SELECT title, brief, why_now, entry_point, reference_items_json
              FROM topic_suggestions
              WHERE report_id = ?
              ORDER BY id ASC
            `,
            [report.id]
          )
        : [];

      result.push({
        id: task.id,
        searchId: task.search_id,
        sourceType: task.source_type,
        status: task.status,
        selectedCount: task.selected_count,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        items: items.map((item) => ({
          id: item.id,
          contentItemId: item.content_item_id,
          contentTitle: item.content_title,
          originalUrl: item.original_url,
          fullTextStatus: item.full_text_status
        })),
        itemSummaries: summaries.map((summary) => ({
          taskItemId: summary.task_item_id,
          summary: summary.summary,
          keywords: JSON.parse(summary.keywords_json) as string[],
          keyPoints: JSON.parse(summary.key_points_json) as string[],
          highlights: JSON.parse(summary.highlights_json) as string[],
          angles: JSON.parse(summary.angles_json) as string[],
          risks: JSON.parse(summary.risks_json) as string[]
        })),
        report: report
          ? {
              reportStatus: report.report_status,
              summary: report.summary,
              hotInsights: report.hot_insights
            }
          : null,
        suggestions: suggestions.map((suggestion) => ({
          title: suggestion.title,
          brief: suggestion.brief,
          whyNow: suggestion.why_now,
          entryPoint: suggestion.entry_point,
          referenceItemIds: JSON.parse(suggestion.reference_items_json) as string[]
        }))
      });
    }

    return result;
  } finally {
    await db.close();
  }
}

export async function getTaskSourceItems(
  dbPath: string | undefined,
  searchId: number,
  sourceType: "wechat" | "xiaohongshu",
  itemIds: string[]
) {
  const db = await getInitializedDatabase(dbPath);

  try {
    if (sourceType === "wechat") {
      const rows = await db.all<
        Array<{
          item_id: string;
          title: string;
          summary: string;
          url: string;
          raw_json: string;
        }>
      >(
        `
          SELECT article_uid AS item_id, title, summary, url, raw_json
          FROM wechat_articles
          WHERE search_id = ? AND article_uid IN (${itemIds.map(() => "?").join(",")})
        `,
        [searchId, ...itemIds]
      );

      return rows.map((row) => ({
        contentItemId: row.item_id,
        title: row.title,
        summary: row.summary,
        originalUrl: row.url,
        rawJson: JSON.parse(row.raw_json) as Record<string, unknown>
      }));
    }

    const rows = await db.all<
      Array<{
        item_id: string;
        title: string;
        summary: string;
        raw_json: string;
      }>
    >(
      `
        SELECT note_id AS item_id, title, desc AS summary, raw_json
        FROM xiaohongshu_notes
        WHERE search_id = ? AND note_id IN (${itemIds.map(() => "?").join(",")})
      `,
      [searchId, ...itemIds]
    );

    return rows.map((row) => ({
      contentItemId: row.item_id,
      title: row.title,
      summary: row.summary,
      originalUrl: "",
      rawJson: JSON.parse(row.raw_json) as Record<string, unknown>
    }));
  } finally {
    await db.close();
  }
}
