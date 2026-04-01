export type Platform = "公众号" | "小红书" | "抖音" | "微博" | "B站";

export type DashboardTab = "内容" | "选题分析与报告" | "监控设置";

export type ContentItem = {
  id: string;
  title: string;
  platform: Platform;
  author: string;
  publishTime: string;
  heat: number;
  tags: string[];
  summary: string;
  url?: string;
};

export type ContentDay = {
  date: string;
  totalItems: number;
  breakoutCount: number;
  leadPlatform: Platform;
  items: ContentItem[];
};

export type TopicInsight = {
  id: string;
  title: string;
  brief: string;
};

export type ReportDay = {
  date: string;
  title: string;
  preview: string;
  hotSummary: string;
  aiTakeaways: string[];
  suggestedFocus: string[];
  topics: TopicInsight[];
};

export type MonitoringSettings = {
  platforms: { name: Platform; status: string; cadence: string }[];
  keywords: string[];
  creators: { name: string; platform: Platform; note: string }[];
  schedule: {
    runTime: string;
    timezone: string;
    scope: string;
  };
};

export type MonitoringCategory = {
  id: string;
  name: string;
  summary: string;
  runStatus: string;
  lastRun: string;
  platformCount: number;
  keywordCount: number;
  creatorCount: number;
  contentDays: ContentDay[];
  reportDays: ReportDay[];
  settings: MonitoringSettings;
  liveSource?: {
    type: "wechat" | "xiaohongshu";
    keyword: string;
  };
};

const categories: MonitoringCategory[] = [
  {
    id: "wechat-monitor",
    name: "公众号文章监控",
    summary: "根据关键词监控公众号文章热度，并将每次搜索保存为可追溯的历史记录。",
    runStatus: "支持手动关键词采集",
    lastRun: "等待首次搜索",
    platformCount: 1,
    keywordCount: 1,
    creatorCount: 0,
    contentDays: [],
    reportDays: [
      {
        date: "最新",
        title: "公众号选题观察",
        preview: "围绕公众号历史查询沉淀热点标题、阅读趋势和选题方向。",
        hotSummary: "当前阶段先保留公众号报告占位，后续可基于历史记录生成 AI 选题建议。",
        aiTakeaways: [
          "高阅读文章的标题结构值得优先拆解。",
          "原创标签和账号来源有助于判断内容价值。",
          "历史记录可以作为后续 AI 分析的输入。"
        ],
        suggestedFocus: ["公众号热文标题", "高阅读账号", "原创内容角度"],
        topics: [
          {
            id: "wechat-placeholder-1",
            title: "公众号热文的标题模板有哪些共性",
            brief: "适合后续用已保存的公众号历史记录做聚类和拆解。"
          }
        ]
      }
    ],
    settings: {
      platforms: [
        { name: "公众号", status: "已接入", cadence: "按关键词实时采集公众号文章" }
      ],
      keywords: ["网文出海"],
      creators: [],
      schedule: {
        runTime: "手动搜索时立即执行",
        timezone: "Australia/Sydney",
        scope: "关键词搜索可触发公众号采集，并将结果落库到 SQLite"
      }
    },
    liveSource: {
      type: "wechat",
      keyword: "网文出海"
    }
  },
  {
    id: "xiaohongshu-monitor",
    name: "小红书监控",
    summary: "根据关键词采集小红书笔记，并将每次搜索结果保存到 SQLite 便于后续分析。",
    runStatus: "支持手动关键词采集",
    lastRun: "等待首次搜索",
    platformCount: 1,
    keywordCount: 1,
    creatorCount: 0,
    contentDays: [],
    reportDays: [
      {
        date: "最新",
        title: "小红书选题观察",
        preview: "围绕小红书历史查询沉淀高互动笔记和内容风格。",
        hotSummary: "当前阶段先保留小红书报告占位，后续可基于已保存的笔记记录生成 AI 选题分析。",
        aiTakeaways: [
          "高点赞、高评论、高收藏笔记更适合作为选题样本。",
          "标签和笔记属性有助于识别内容方向。",
          "保存下来的历史记录可以直接喂给后续 AI 分析。"
        ],
        suggestedFocus: ["高互动笔记", "种草结构", "评论驱动型内容"],
        topics: [
          {
            id: "xhs-placeholder-1",
            title: "高互动小红书笔记的内容结构有哪些共性",
            brief: "适合后续围绕已保存的小红书历史记录生成平台专属选题建议。"
          }
        ]
      }
    ],
    settings: {
      platforms: [
        { name: "小红书", status: "已接入", cadence: "按关键词实时采集小红书笔记" }
      ],
      keywords: ["网文出海"],
      creators: [],
      schedule: {
        runTime: "手动搜索时立即执行",
        timezone: "Australia/Sydney",
        scope: "关键词搜索可触发小红书采集，并将结果落库到 SQLite"
      }
    },
    liveSource: {
      type: "xiaohongshu",
      keyword: "网文出海"
    }
  },
  {
    id: "ai-overseas",
    name: "AI 出海内容监控",
    summary: "关注 AI SaaS 出海案例、增长素材与社媒传播热点。",
    runStatus: "今日 08:00 已自动运行",
    lastRun: "3 月 30 日 08:00",
    platformCount: 4,
    keywordCount: 7,
    creatorCount: 6,
    contentDays: [
      {
        date: "3 月 30 日",
        totalItems: 31,
        breakoutCount: 7,
        leadPlatform: "微博",
        items: [
          {
            id: "o1",
            title: "AI 出海项目最近为什么都在讲真实营收",
            platform: "微博",
            author: "出海增长情报局",
            publishTime: "08:48",
            heat: 93,
            tags: ["营收截图", "信任感", "增长"],
            summary: "真实数据截图建立信任，是当前传播的核心抓手。"
          },
          {
            id: "o2",
            title: "我拆了 10 个 AI SaaS 官网，发现转化文案都在强调这个点",
            platform: "B站",
            author: "Landing Page Lab",
            publishTime: "13:37",
            heat: 90,
            tags: ["官网拆解", "转化", "AI SaaS"],
            summary: "拆解型内容非常适合沉淀为选题库。"
          }
        ]
      }
    ],
    reportDays: [
      {
        date: "3 月 30 日",
        title: "AI 出海方向日报",
        preview: "真实增长结果比增长技巧更能驱动高意向用户停留。",
        hotSummary: "高热内容普遍强化了营收、用户量和转化率等结果信号，说明市场已从概念期转向结果验证期。",
        aiTakeaways: [
          "结果型叙事对高质量用户更有吸引力。",
          "网站拆解与案例拆解可以互相联动。",
          "国际化表达和本土化案例正在同时被讨论。"
        ],
        suggestedFocus: ["真实营收案例", "Landing Page 拆解", "国际化表达模板"],
        topics: [
          {
            id: "ot1",
            title: "为什么 AI 出海内容必须拿结果说话",
            brief: "结合营收、注册量和转化率截图做内容，适合持续迭代。"
          }
        ]
      }
    ],
    settings: {
      platforms: [
        { name: "抖音", status: "已接入", cadence: "每日采集案例型短视频" },
        { name: "小红书", status: "已接入", cadence: "每日采集出海经验帖" },
        { name: "微博", status: "已接入", cadence: "实时抓取热门讨论" },
        { name: "B站", status: "已接入", cadence: "每日同步长视频拆解" }
      ],
      keywords: ["AI SaaS", "出海增长", "海外获客", "独立开发", "Landing Page", "营收截图", "国际化表达"],
      creators: [
        { name: "出海增长情报局", platform: "微博", note: "偏增长叙事" },
        { name: "Landing Page Lab", platform: "B站", note: "擅长页面拆解" },
        { name: "出海叙事手册", platform: "小红书", note: "偏品牌内容" },
        { name: "Global Indie Notes", platform: "微博", note: "国际视角强" },
        { name: "Ads Creative Map", platform: "抖音", note: "素材感强" },
        { name: "SaaS Builder Daily", platform: "B站", note: "案例更新稳定" }
      ],
      schedule: {
        runTime: "每天 08:00",
        timezone: "Australia/Sydney",
        scope: "抓取平台热门内容，AI 归纳热点并输出出海选题建议"
      }
    }
  }
];

export function getCategories() {
  return categories;
}

export function getDefaultCategory() {
  return categories[0];
}

export function getDefaultPlatform(category: MonitoringCategory) {
  return category.settings.platforms[0].name;
}

export function getDefaultContentDate(category: MonitoringCategory) {
  return category.contentDays[0]?.date ?? "";
}

export function getDefaultReportDate(category: MonitoringCategory) {
  return category.reportDays[0]?.date ?? "";
}

export function getRecentTopics(category: MonitoringCategory) {
  return category.reportDays.flatMap((report) =>
    report.topics.map((topic) => ({
      ...topic,
      date: report.date
    }))
  );
}
