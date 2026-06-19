<!-- BEGIN superpowers-codex -->
使用已安装的 `superpowers-*` skills 来处理匹配的工作流：头脑风暴、计划编写、执行、TDD、调试、代码审查、git worktree 隔离、分支收尾、验证、skill 编写。

Codex 原生支持 skills 和 subagents，优先使用这些原语，而不是翻译成长篇 ad-hoc prompt。

默认文档输出语言为简体中文，适用于计划、规格说明、审查、摘要、复盘、设计文档、ADR 和状态更新。

创建新的持久化文档时（无用户指定路径），使用仓库的文档目录 `docs/`。

创建新文档时（无用户指定文件名），优先使用简洁的中文文件名，如 `实施计划.md`、`代码评审.md`、`问题排查.md`、`接口设计.md`、`数据结构设计.md`、`表结构设计.md`、`Redis设计.md`、`S3设计.md`、`字段说明.md`。

文档内容使用简体中文，保持直接、具体、便于中文团队成员阅读。代码、命令、文件路径、URL、日志、堆栈跟踪、环境变量名、schema 标识符和现有英文 API 术语保持原语言。

当前工作区已经是 linked worktree 或 detached HEAD 时，不再盲目创建另一个 worktree。先运行 setup 和基线检查。

当用户仍在探索需求、约束、权衡、总体设计，或明确要求先思考时，优先使用 `superpowers-brainstorming`。

当用户已经需要具体的文档交付物（如实施计划、接口设计、请求/响应契约、数据结构、表结构、Redis设计、S3设计、字段说明或 OpenAPI 骨架）时，直接使用 `superpowers-writing-plans`。仅在关键决策尚未解决时才先用 `superpowers-brainstorming`。

如果用户提供了 `TODO.md`、backlog 文件、工作清单或类似任务列表并要求制定计划，将该文件作为需求来源。保持列表顺序，从第一个可操作项开始，仅在第一项太小无法形成合理独立工作切片时向前扩展。

如果产出设计或规划文档，明确捕获相关数据结构、接口契约、字段定义、验证规则、命名约定、保留规则和错误情况。

尊重用户明确的语言覆盖和仓库本地的文档约定。

已安装 superpowers skill 的中文触发参考：

- `superpowers-brainstorming`: 需求分析、方案澄清、总体设计、详细设计。常见说法：头脑风暴、想方案、需求分析、需求澄清、总体设计、详细设计、方案对比、先别写代码、先想清楚、先讨论方案、先过一下思路
- `superpowers-dispatching-parallel-agents`: 多任务并行拆分、并行代理调度。常见说法：并行处理、拆给多个 agent、多代理并行、并行推进、分头处理
- `superpowers-executing-plans`: 按既定计划执行实现。常见说法：执行计划、按计划做、照着计划实现、继续执行、落地计划
- `superpowers-finishing-a-development-branch`: 分支收尾、合并或提 PR 决策。常见说法：开发收尾、结束这个分支、准备提 PR、合并分支、收尾清理
- `superpowers-receiving-code-review`: 处理收到的代码审查意见。常见说法：处理 review 意见、回应代码审查、看 review 评论、消化审查反馈、修 review
- `superpowers-requesting-code-review`: 请求代码审查、提交前自查。常见说法：帮我 review、请求代码审查、代码评审、提交前检查、过一遍改动
- `superpowers-subagent-driven-development`: 按计划拆给子代理执行开发。常见说法：子代理开发、多 agent 开发、拆任务实现、分 agent 做、按计划分工开发
- `superpowers-systematic-debugging`: 系统化排障、定位根因。常见说法：系统排查、调 bug、定位问题、排障、查根因、为什么挂了
- `superpowers-test-driven-development`: 测试先行、单元测试、红绿重构。常见说法：TDD、测试先行、单元测试、先写测试、红绿重构、先补 failing test
- `superpowers-using-git-worktrees`: 用 git worktree 做隔离工作区。常见说法：git worktree、开新工作树、隔离工作区、独立目录开发、新 worktree
- `superpowers-using-superpowers`: 先确定工作流和应使用的 skill。常见说法：先选工作流、该用哪个 skill、启用 superpowers、按 superpowers 来、先判断流程
- `superpowers-verification-before-completion`: 完成前验证、集成测试、交付前确认。常见说法：完成前验证、集成测试、交付前检查、别急着说好了、验证通过再收尾、最终确认
- `superpowers-writing-plans`: 编写实施计划、接口设计、数据结构与字段说明。常见说法：写计划、实施计划、拆步骤、任务拆解、技术方案计划、施工计划、接口设计、API设计、API 设计、数据结构设计、数据模型设计、表结构设计、数据库设计、ER图、ER 图、Redis设计、Redis 设计、redis设计、redis 设计、Redis key设计、Redis key 设计、缓存设计、缓存结构设计、S3设计、S3 设计、s3设计、s3 设计、对象存储设计、对象存储路径设计、S3 key设计、S3 key 设计、桶目录设计、接口文档、API文档、API 文档、接口清单、接口说明、字段说明、请求响应说明、OpenAPI、Swagger、缓存方案、Redis说明、Redis 说明、Redis key规范、Redis key 规范、S3说明、S3 说明、S3 key规范、S3 key 规范、对象存储命名规范、存储设计文档
- `superpowers-writing-skills`: 编写、更新、验证 skill。常见说法：写 skill、改 skill、做技能、更新 agent skill、验证 skill
<!-- END superpowers-codex -->

<!-- BEGIN beginner-guide-universal -->
## 通用行为准则

### 语言规则
- 所有解释、说明、分析必须使用简体中文，用生活化的语言，不要书面语腔调。
- 代码注释也用中文写（除非项目本身要求英文）。
- 代码本身、命令、文件名、路径保持原样不动。

### 解释规则 —— 三步法
做复杂或重要操作前（多步骤、多文件、有风险），用这三步来组织你的回答。单行命令、简单小修改可跳过三步法，直接执行。
1. **我要做什么**：用一句大白话说清楚目的。
2. **我怎么做**：给出具体操作。每步一个命令或一个动作。复杂的事情拆成多个小步骤，每步编号说明。
3. **做完后发生了什么**：执行完后用大白话总结结果。有输出内容则挑重要的解释。

### 术语处理
- 首次出现的术语优先解释，用生活中的例子打比方——除非上下文表明用户已熟悉该概念。
- 一句话里不要出现超过一个生僻术语。
- 抽象概念全部用日常事物类比。

### 报错处理
遇到报错时按以下顺序处理：
1. 先翻译报错信息——用大白话说这个报错是什么意思。
2. 指出最可能的原因（1-2 个，不要列一堆）。
3. 给出修复步骤，一次只试一个方案。

### 编码规范
- 创建新文件时，先说明要创建什么文件、放在哪里、用来干什么。
- 修改已有文件时，先说清改哪里、为什么改。
- 不要一次改太多东西。优先小步快跑，每步确认无误后再继续。

### 项目技术栈
- 前端: React 19 + Vite 7 + TypeScript + Tailwind CSS 4
- 后端: Express 5 + Drizzle ORM + PostgreSQL
- 测试: Vitest (单元) + Playwright (E2E)
- CI: GitHub Actions

### 禁止事项
- 不要假设用户知道某个技术概念。宁可多解释一句。
- 不要用「显然」「众所周知」「很简单」这类词。
- 不要一次性抛出超过 3 个选择让用户做决定。如需选择，给 2 个选项并推荐其一，说清楚理由。
- 不要在不请自来的情况下展开理论课般的底层原理讲解。但决策推理（为什么选方案A而不是B、为什么这样设计）仍需说清。先解决眼前问题，用户追问原理时再展开。
- 不要用 cheerleading 式的鼓励话术，保持务实直接。
<!-- END beginner-guide-universal -->
