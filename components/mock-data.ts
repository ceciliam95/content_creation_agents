export type Platform = "公众号" | "抖音" | "小红书" | "微博" | "B站";

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
    type: "wechat";
    keyword: string;
  };
};

const categories: MonitoringCategory[] = [
  {
    id: "wechat-monitor",
    name: "公众号文章监控",
    summary: "按关键词监控公众号文章热度，供首页选题监控直接查看公众号内容走势。",
    runStatus: "打开页面时实时拉取",
    lastRun: "等待首次请求",
    platformCount: 1,
    keywordCount: 1,
    creatorCount: 0,
    contentDays: [],
    reportDays: [
      {
        date: "最新",
        title: "公众号选题观察",
        preview: "围绕“网文出海”持续观察公众号文章结构、叙事角度和阅读反馈。",
        hotSummary:
          "当前报告区先保留为原型占位，后续可基于公众号热门文章再接入 AI 选题分析。",
        aiTakeaways: [
          "优先关注高阅读文章的标题结构和开头叙事方式。",
          "原创文章和地域标签有助于判断内容源头与角度差异。",
          "后续可把公众号热文直接送入 AI 分析，生成选题建议。"
        ],
        suggestedFocus: ["热文标题", "高阅读账号", "原创内容角度"],
        topics: [
          {
            id: "wechat-topic-1",
            title: "网文出海赛道有哪些正在升温的新叙事",
            brief: "通过公众号近期高阅读文章总结角度变化，适合后续扩展为日报或周报栏目。"
          },
          {
            id: "wechat-topic-2",
            title: "高阅读公众号都在怎样包装网文出海案例",
            brief: "重点拆解标题、摘要和案例呈现方式，帮助选题监控页更快定位可借鉴方向。"
          }
        ]
      }
    ],
    settings: {
      platforms: [
        { name: "公众号", status: "已接入", cadence: "按关键词实时拉取公众号文章" }
      ],
      keywords: ["网文出海"],
      creators: [],
      schedule: {
        runTime: "页面打开时可手动刷新",
        timezone: "Australia/Sydney",
        scope: "以关键词“网文出海”查询近 7 天公众号文章"
      }
    },
    liveSource: {
      type: "wechat",
      keyword: "网文出海"
    }
  },
  {
    id: "vibecoding",
    name: "VibeCoding 选题监控",
    summary: "观察创作者如何把 vibe coding 做成面向大众的叙事内容。",
    runStatus: "等待明日 08:00 自动运行",
    lastRun: "3 月 29 日 08:00",
    platformCount: 4,
    keywordCount: 5,
    creatorCount: 4,
    contentDays: [
      {
        date: "3 月 30 日",
        totalItems: 22,
        breakoutCount: 4,
        leadPlatform: "小红书",
        items: [
          {
            id: "v1",
            title: "不会写代码的人，为什么也开始做 vibe coding",
            platform: "小红书",
            author: "创意工作台",
            publishTime: "08:36",
            heat: 95,
            tags: ["低门槛", "创作者", "AI 工具"],
            summary: "热门点在于把技术能力翻译成创作者的表达自由。"
          },
          {
            id: "v2",
            title: "一条视频带你看懂 vibe coding 的爽点",
            platform: "抖音",
            author: "AI 创作笔记",
            publishTime: "11:08",
            heat: 87,
            tags: ["上手", "爽点", "短视频"],
            summary: "节奏快、成果快的内容在平台上更容易爆。"
          }
        ]
      },
      {
        date: "3 月 29 日",
        totalItems: 19,
        breakoutCount: 3,
        leadPlatform: "抖音",
        items: [
          {
            id: "v3",
            title: "vibe coding 正在重写内容创作者的制作流程",
            platform: "抖音",
            author: "新媒体实验站",
            publishTime: "15:21",
            heat: 84,
            tags: ["制作流程", "创作者", "趋势"],
            summary: "趋势型内容，适合延伸为中长图文与播客话题。"
          }
        ]
      }
    ],
    reportDays: [
      {
        date: "3 月 30 日",
        title: "VibeCoding 方向日报",
        preview: "大众视角的“我也能做”正在替代技术视角的“这功能多强”。",
        hotSummary: "高热内容偏好情绪价值和参与感，最强动机来自低门槛创造与快速反馈。",
        aiTakeaways: [
          "非技术用户更在意表达能力被放大，而不是具体技术实现。",
          "前后对比类内容仍是最稳的转化入口。",
          "教程类如果能先给结果，再讲步骤，传播更强。"
        ],
        suggestedFocus: ["前后对比案例", "新人视角体验", "创作者生产力升级"],
        topics: [
          {
            id: "vt1",
            title: "零代码用户第一次尝试 vibe coding 会经历什么",
            brief: "用第一视角记录体验，爆点在于代入感强，增长空间在于可以做连续更新。"
          },
          {
            id: "vt2",
            title: "为什么 vibe coding 更适合内容创作者而不是程序员",
            brief: "观点切入具有争议度，容易引发评论区立场表达，适合做话题扩散。"
          }
        ]
      }
    ],
    settings: {
      platforms: [
        { name: "抖音", status: "已接入", cadence: "每日采集热门前 40" },
        { name: "小红书", status: "已接入", cadence: "每日采集热门前 30" },
        { name: "微博", status: "已接入", cadence: "实时观察趋势词" },
        { name: "B站", status: "已接入", cadence: "每日上午抓取热视频" }
      ],
      keywords: ["Vibe Coding", "零代码开发", "创作者工具", "AI 做产品", "AI 做网页"],
      creators: [
        { name: "创意工作台", platform: "小红书", note: "偏创作者叙事" },
        { name: "AI 创作笔记", platform: "抖音", note: "节奏型短视频" },
        { name: "新媒体实验站", platform: "抖音", note: "趋势观察" },
        { name: "产品灵感集", platform: "微博", note: "话题扩散能力强" }
      ],
      schedule: {
        runTime: "每天 08:00",
        timezone: "Australia/Sydney",
        scope: "按关键词和创作者采集内容，并生成最近 7 天主题汇总"
      }
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
      },
      {
        date: "3 月 29 日",
        totalItems: 27,
        breakoutCount: 5,
        leadPlatform: "小红书",
        items: [
          {
            id: "o3",
            title: "独立开发者如何把 AI 产品讲成全球都能听懂的故事",
            platform: "小红书",
            author: "出海叙事手册",
            publishTime: "16:11",
            heat: 88,
            tags: ["品牌叙事", "国际化", "独立开发"],
            summary: "从叙事切入的内容比纯投放干货更容易扩圈。"
          }
        ]
      }
    ],
    reportDays: [
      {
        date: "3 月 30 日",
        title: "AI 出海方向日报",
        preview: "“真实增长结果”比“增长技巧”更能驱动高意向用户停留。",
        hotSummary:
          "今天的高热内容普遍强化了营收、用户量和转化率等结果信号，说明市场已经从概念期转向结果验证期。",
        aiTakeaways: [
          "结果型叙事对高质量用户更有吸引力。",
          "网站拆解与案例拆解可以互相联动，形成持续内容主题。",
          "对外传播中，国际化表达和本土化案例正在同时被讨论。"
        ],
        suggestedFocus: ["真实营收案例", "Landing Page 拆解", "国际化表达模板"],
        topics: [
          {
            id: "ot1",
            title: "为什么 AI 出海内容必须拿结果说话",
            brief: "结合营收、注册量和转化率截图做内容，爆点在于可信度强，增长空间在于可以持续迭代不同阶段的数据。"
          },
          {
            id: "ot2",
            title: "10 个 AI SaaS 首页都在强调什么卖点",
            brief: "适合做拆解系列，兼具教育性和收藏价值，可沉淀为长期栏目。"
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
