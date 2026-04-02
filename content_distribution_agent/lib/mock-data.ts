import type { SessionRecord } from "@/lib/types";

const sessions: SessionRecord[] = [
  {
    id: "session-ai-tools",
    title: "AI 出海工具内容包",
    createdAt: "2026-04-02 10:20",
    selectedPlatforms: ["wechat", "xiaohongshu", "twitter", "videoScript"],
    request:
      "围绕 AI 出海工具生成一套内容，目标受众是独立开发者和内容创业者，强调趋势判断和机会分析。",
    masterDraft: {
      title: "AI 出海工具进入结构化增长阶段",
      audience: "独立开发者、内容创业者",
      objective: "输出跨平台内容包，建立专业认知和增长引导",
      keyMessage: "AI 出海工具赛道正在从工具罗列转向结构化增长与差异化定位。",
      outline: [
        "市场变化与机会",
        "为什么现在值得做",
        "用户最关心的问题",
        "不同平台的表达重点"
      ],
      platformNotes: [
        "公众号强调趋势和框架",
        "小红书强调钩子和可感知收益",
        "Twitter 同时生成单条与 thread",
        "视频脚本强调节奏与开场 hook"
      ]
    },
    outputs: {
      wechat: {
        title: "AI 出海工具，为什么现在是内容创业者的窗口期？",
        abstract: "从趋势、供给和用户需求三层拆解 AI 出海工具内容机会。",
        body: "这是一篇用于原型展示的公众号正文示例。",
        cta: "如果你想继续看这一赛道的选题拆解，欢迎留言。"
      },
      xiaohongshu: {
        images: ["封面 1", "封面 2", "封面 3"],
        hook: "AI 出海工具，真的到窗口期了",
        body: "适合原型演示的小红书正文示例。",
        tags: ["AI 出海", "独立开发", "内容创业"],
        prompt: "你会先做工具测评，还是先做趋势解读？"
      },
      twitter: {
        single:
          "AI 出海工具正在从“新鲜感赛道”转向“结构化增长赛道”。机会不只在工具本身，更在内容分发与定位。",
        thread: [
          "1/ AI 出海工具这个话题，为什么现在又值得重做一遍？",
          "2/ 因为市场关注点已经变了：从工具炫技，转向增长效率。",
          "3/ 用户真正想看的，不只是工具清单，而是怎么选、怎么用、怎么做差异化。",
          "4/ 所以内容机会，正在从测评转向框架和判断。",
          "5/ 这也是为什么现在是重新入场的时间点。"
        ]
      },
      videoScript: {
        title: "AI 出海工具内容脚本",
        hook: "很多人以为 AI 出海工具已经卷完了，其实真正的窗口期才刚开始。",
        sections: ["第一部分：赛道变化", "第二部分：用户需求", "第三部分：内容机会"],
        closing: "如果你想继续看这个方向的系列拆解，记得关注。"
      }
    }
  }
];

export function getMockSessions() {
  return sessions;
}
