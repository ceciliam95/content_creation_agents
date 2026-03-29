export type Platform =
  | "抖音"
  | "小红书"
  | "微博"
  | "B站";

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
};

const categories: MonitoringCategory[] = [
  {
    id: "claudecode",
    name: "ClaudeCode 选题监控",
    summary: "聚焦 AI 编程效率、工作流演示与开发者工具内容走势",
    runStatus: "今日 08:00 已自动运行",
    lastRun: "3 月 30 日 08:00",
    platformCount: 4,
    keywordCount: 6,
    creatorCount: 5,
    contentDays: [
      {
        date: "3 月 30 日",
        totalItems: 28,
        breakoutCount: 6,
        leadPlatform: "抖音",
        items: [
          {
            id: "c1",
            title: "Claude Code 实战：20 分钟接管重复开发任务",
            platform: "抖音",
            author: "Prompt 工程所",
            publishTime: "09:12",
            heat: 98,
            tags: ["AI 编程", "工作流", "提效"],
            summary: "用真实编码案例演示从需求拆解到生成代码的完整闭环，评论区讨论集中在提效幅度。"
          },
          {
            id: "c2",
            title: "Vibe Coding 和 Claude Code 谁更适合内容团队",
            platform: "小红书",
            author: "工具流研究员",
            publishTime: "10:40",
            heat: 91,
            tags: ["对比测评", "内容团队", "AI 工具"],
            summary: "对比不同角色使用场景，爆点在于把开发工具翻译成运营语言。"
          },
          {
            id: "c3",
            title: "我用 Claude Code 搭了一个运营日报系统",
            platform: "B站",
            author: "运营自动化实验室",
            publishTime: "12:05",
            heat: 89,
            tags: ["自动化", "日报", "案例拆解"],
            summary: "长视频内容围绕业务场景展开，用户重点关注具体提示词与流程配置。"
          },
          {
            id: "c4",
            title: "今天最值得抄的 AI 编程开场钩子有哪些",
            platform: "微博",
            author: "内容钩子观察局",
            publishTime: "14:18",
            heat: 84,
            tags: ["内容钩子", "AI 编程", "传播"],
            summary: "围绕高传播标题句式进行拆分，适合延展为选题模板。"
          }
        ]
      },
      {
        date: "3 月 29 日",
        totalItems: 24,
        breakoutCount: 5,
        leadPlatform: "小红书",
        items: [
          {
            id: "c5",
            title: "开发者为什么开始公开自己的 AI 工作流",
            platform: "小红书",
            author: "远程协作手册",
            publishTime: "09:55",
            heat: 92,
            tags: ["工作流", "个人品牌", "开发者"],
            summary: "把工具展示变成个人方法论展示，用户更愿意收藏。"
          },
          {
            id: "c6",
            title: "Claude Code 的真实上手门槛到底高不高",
            platform: "抖音",
            author: "AI 工具上手官",
            publishTime: "11:22",
            heat: 88,
            tags: ["入门", "教程", "误区"],
            summary: "内容热度来自反常识切入，评论区关注新手是否能直接复用流程。"
          }
        ]
      },
      {
        date: "3 月 28 日",
        totalItems: 18,
        breakoutCount: 3,
        leadPlatform: "B站",
        items: [
          {
            id: "c7",
            title: "我把 7 个运营动作交给 Claude Code 之后发生了什么",
            platform: "B站",
            author: "增长实验室",
            publishTime: "16:30",
            heat: 86,
            tags: ["增长", "自动化", "复盘"],
            summary: "以结果复盘驱动观看，适合拆成系列内容。"
          }
        ]
      },
      {
        date: "3 月 27 日",
        totalItems: 15,
        breakoutCount: 2,
        leadPlatform: "微博",
        items: [
          {
            id: "c8",
            title: "AI 编程工具内容开始从炫技转向交付结果",
            platform: "微博",
            author: "产品内容观察",
            publishTime: "13:14",
            heat: 78,
            tags: ["趋势", "交付结果", "定位"],
            summary: "观点型内容，适合用于报告里的趋势判断。"
          }
        ]
      },
      {
        date: "3 月 26 日",
        totalItems: 17,
        breakoutCount: 3,
        leadPlatform: "抖音",
        items: [
          {
            id: "c9",
            title: "如何把一段需求直接变成能演示的原型",
            platform: "抖音",
            author: "独立开发加速器",
            publishTime: "18:05",
            heat: 82,
            tags: ["原型", "需求拆解", "实操"],
            summary: "实操型内容带动完播，适合发展为教程选题。"
          }
        ]
      }
    ],
    reportDays: [
      {
        date: "3 月 30 日",
        title: "ClaudeCode 方向日报",
        preview: "运营团队最关注的不是模型本身，而是具体能替代哪些重复动作。",
        hotSummary: "高热内容集中在“AI 工具直接接手实际工作”这一叙事，用户对可复制流程和投入产出比最敏感。",
        aiTakeaways: [
          "结果导向的案例比单纯工具介绍更容易触发收藏和转发。",
          "新手门槛类内容持续有流量，说明市场仍处于认知教育阶段。",
          "对比型选题能够帮助运营人快速建立工具选型心智。"
        ],
        suggestedFocus: ["抖音短实操", "小红书对比总结", "B站完整案例"],
        topics: [
          {
            id: "ct1",
            title: "内容团队能立刻交给 Claude Code 的 5 个动作",
            brief: "从日报、脚本、竞品整理等高频动作切入，爆点在于直接回应运营人的效率焦虑，增长空间来自场景可扩展和模板可复用。"
          },
          {
            id: "ct2",
            title: "Claude Code 与 Vibe Coding 的团队分工指南",
            brief: "用角色分工视角做对比，解释为什么不同岗位该用不同工作流，适合形成争议讨论并拉动互动。"
          },
          {
            id: "ct3",
            title: "从一句需求到一个原型页：AI 编程最适合做什么",
            brief: "围绕低门槛高成就感场景展开，爆点在于快速可视化结果，增长空间在于可做成系列案例。"
          }
        ]
      },
      {
        date: "3 月 29 日",
        title: "ClaudeCode 方向日报",
        preview: "公开工作流比堆功能更能建立可信度。",
        hotSummary: "用户更愿意看别人如何把 AI 工具融入团队流程，而不是单独展示模型能力。",
        aiTakeaways: [
          "工作流透明化正在成为内容竞争点。",
          "团队协作场景比个人尝鲜场景更容易形成收藏。",
          "“我这样做省了多少时间”依然是最强传播母题。"
        ],
        suggestedFocus: ["协作流程拆解", "节省时间对比", "真实案例截图"],
        topics: [
          {
            id: "ct4",
            title: "把团队 AI 工作流讲清楚，比介绍工具更重要",
            brief: "强调流程公开带来的信任感，适合作为观点类和案例类内容的中间桥梁。"
          },
          {
            id: "ct5",
            title: "运营最常见的 AI 编程误解有哪些",
            brief: "通过误区切入降低理解门槛，容易带来评论区补充与争议。"
          }
        ]
      }
    ],
    settings: {
      platforms: [
        { name: "抖音", status: "已接入", cadence: "每日采集热门前 50" },
        { name: "小红书", status: "已接入", cadence: "每日采集热门前 30" },
        { name: "微博", status: "已接入", cadence: "按关键词热帖抓取" },
        { name: "B站", status: "已接入", cadence: "每日采集热视频前 20" }
      ],
      keywords: ["Claude Code", "AI 编程", "开发工作流", "运营自动化", "提示词工程", "原型生成"],
      creators: [
        { name: "Prompt 工程所", platform: "抖音", note: "高频发布短实操" },
        { name: "工具流研究员", platform: "小红书", note: "偏对比评测" },
        { name: "运营自动化实验室", platform: "B站", note: "长视频案例拆解" },
        { name: "内容钩子观察局", platform: "微博", note: "擅长标题结构" },
        { name: "增长实验室", platform: "B站", note: "复盘型内容稳定" }
      ],
      schedule: {
        runTime: "每天 08:00",
        timezone: "Australia/Sydney",
        scope: "自动采集各平台内容，筛选热门前 10 并生成 AI 报告"
      }
    }
  },
  {
    id: "vibecoding",
    name: "VibeCoding 选题监控",
    summary: "观察创作者如何把 vibe coding 做成面向大众的叙事内容",
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
    summary: "关注 AI SaaS 出海案例、增长素材与社媒传播热点",
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
        hotSummary: "今天的高热内容普遍强化了营收、用户量和转化率等结果信号，说明市场已经从概念期转向结果验证期。",
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
