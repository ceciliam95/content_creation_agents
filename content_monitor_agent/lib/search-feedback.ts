import type { ContentDay } from "@/components/mock-data";

export type MonitorSourceType = "wechat" | "xiaohongshu";

export function getBlockingContentErrorMessage(
  errorMessage: string | null,
  days: ContentDay[]
) {
  if (!errorMessage) {
    return null;
  }

  return days.length === 0 ? errorMessage : null;
}

export function getInlineSearchFeedback(errorMessage: string | null) {
  return errorMessage;
}

export function formatMonitorStatusError(
  sourceType: MonitorSourceType,
  status: number
) {
  const sourceLabel = sourceType === "wechat" ? "微信" : "小红书";

  return `${sourceLabel}上游接口当前返回 ${status}，本次搜索未成功，请稍后重试。`;
}

export function formatMonitorRequestError(
  sourceType: MonitorSourceType,
  message?: string
) {
  const sourceLabel = sourceType === "wechat" ? "微信" : "小红书";

  if (!message || message === "fetch failed") {
    return `${sourceLabel}请求暂时不可用，可能是网络或上游服务异常。`;
  }

  return `${sourceLabel}请求失败：${message}`;
}
