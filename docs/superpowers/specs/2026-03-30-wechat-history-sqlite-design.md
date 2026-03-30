# 公众号关键词历史与 SQLite 持久化设计

## 目标

为首页“公众号文章监控”增加持久化能力：

- 每次关键词查询都保存到 SQLite
- 每次查询返回的公众号文章结果也保存到 SQLite
- 首页左侧分类区下方新增“历史关键词”列表
- 用户可以点击历史记录回看该次查询的文章结果
- 为未来的选题分析与选题建议预留数据库关联结构与界面占位

## 当前状态确认

当前实现不具备持久化能力：

- 公众号文章数据只存在运行时内存中
- 查询关键词不会保存
- 页面刷新后当前查询结果会丢失
- 没有历史关键词列表
- 没有历史选题信息的持久化结构

## 方案概览

采用 Next.js 服务端 + SQLite 文件数据库的轻量方案。

每次用户在首页输入关键词并回车时：

1. 服务端代理请求公众号接口
2. 创建一条查询历史记录
3. 将本次返回的公众号文章写入 SQLite
4. 为这次查询创建一条“待分析”的选题报告占位记录
5. 返回本次查询结果给前端
6. 前端刷新左侧“历史关键词”列表，并切换到该次查询详情

## 数据模型

### 1. keyword_searches

保存每次搜索本身。

- `id`
- `keyword`
- `source_type`，当前固定为 `wechat`
- `status`，如 `success`、`failed`
- `article_count`
- `created_at`
- `updated_at`

### 2. wechat_articles

保存某次搜索返回的公众号文章。

- `id`
- `search_id`，关联 `keyword_searches.id`
- `article_uid`，由 `ghid + publish_time + wx_id` 组成
- `title`
- `author_name`
- `wx_id`
- `publish_time`
- `publish_time_str`
- `read_count`
- `like_count`
- `looking_count`
- `is_original`
- `classify`
- `ip_wording`
- `summary`
- `url`
- `avatar`
- `raw_json`
- `created_at`

### 3. topic_reports

为未来 AI 分析预留。

- `id`
- `search_id`，关联 `keyword_searches.id`
- `report_status`，初始为 `pending`
- `summary`
- `hot_insights`
- `created_at`
- `updated_at`

### 4. topic_suggestions

保存某份报告下的选题建议，当前阶段可为空。

- `id`
- `report_id`
- `title`
- `brief`
- `created_at`

## 关系设计

- 一次关键词查询对应多篇公众号文章
- 一次关键词查询对应一份或多份选题报告
- 一份选题报告对应多条选题建议

这样设计的原因：

- 历史列表以“查询”为中心，用户更容易理解
- 未来选题分析直接挂在某次查询下，不需要改表结构
- 后续如果扩展到其他平台，可以复用查询历史这一层

## 页面结构调整

### 左侧栏

保留现有分类区，在下方新增“历史关键词”区域。

每条历史卡片显示：

- 关键词
- 查询时间
- 文章数量
- 查询状态
- 选题状态，如“待分析”

点击历史记录后，右侧主区域切换到该次查询详情。

### 右侧主区域

保留顶部“关键词搜索”输入框，仍只在“公众号文章监控”分类下启用。

行为改为：

- 输入关键词并回车
- 创建并保存查询历史
- 保存文章结果
- 刷新左侧历史列表
- 当前页面切换到最新这次查询结果

### 内容 Tab

从“当前内存数据”改成“当前查询记录的数据”。

当前查询记录可能来自：

- 用户刚发起的最新查询
- 用户点击某条历史关键词后打开的历史查询

### 选题分析与报告 Tab

当前阶段先读取 `topic_reports` 的占位状态。

展示：

- 当前状态：待分析
- 当前关联关键词
- 当前关联查询时间
- 后续这里将显示这次查询对应的选题洞察与选题建议

### 监控设置 Tab

保持原有设置，但在公众号文章监控分类中补充说明：

- 当前正在使用哪个关键词
- 历史查询会被保存到本地 SQLite

## API 设计

### 修改现有 `/api/wechat-articles`

新增持久化逻辑：

- 调用第三方接口
- 写入 `keyword_searches`
- 写入 `wechat_articles`
- 创建 `topic_reports` 占位记录
- 返回 `searchId`、`keyword`、`days`

### 新增 `/api/search-history`

用途：

- 获取历史关键词列表
- 获取指定 `searchId` 的完整历史详情

建议支持：

- `GET /api/search-history` 返回最近历史
- `GET /api/search-history?id=...` 返回某次历史详情

## 存储位置

SQLite 文件建议保存在项目根目录下的 `data/monitor.db`。

原因：

- 明确可见
- 适合本地原型与开发
- 便于后续备份或迁移

`data/` 目录和数据库文件应加入 `.gitignore`。

## 风险与处理

### 1. SQLite 库选择

优先使用适合 Node 环境的轻量 SQLite 客户端，封装成单独数据库模块，避免在页面组件里直接写 SQL。

### 2. 历史记录增长

当前阶段不做删除和归档，仅做最近记录展示。

### 3. 未来 AI 分析接入

当前先创建 `pending` 状态占位，后续接入 AI 时只需要更新 `topic_reports` 与 `topic_suggestions`。

## 线框说明

### 左侧栏

- 分类管理
- 历史关键词区域

### 右侧栏

- 顶部关键词搜索
- 当前查询摘要
- Tabs
- 内容详情 / 报告占位 / 设置

## 验收标准

- 查询关键词后，刷新页面仍能看到历史关键词记录
- 点击历史记录能回看当次公众号文章结果
- 新搜索后左侧历史关键词列表立即更新
- 数据真正写入 SQLite，而非只保存在前端状态
- 选题报告区对历史记录展示“待分析”占位信息
