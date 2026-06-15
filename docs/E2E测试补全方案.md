# E2E 测试补全方案

基于操作手册第五章测试用例清单的覆盖缺口分析。

## 已覆盖（30 个测试通过）

| 手册分类 | 覆盖文件 | 覆盖用例 |
|---------|---------|---------|
| A. 基础功能 | login.spec.ts, search.spec.ts, navigation.spec.ts | A1-A7 |
| B. 生命周期 | knowledge.spec.ts, review-submit.spec.ts | B1-B9 |
| C. 组织架构 | drive.spec.ts | C4-C7 |
| D. 收藏历史 | favorites.spec.ts + 后端集成测试 | D1-D8 |
| E. 权限控制 | 后端 permissions.test.ts | E1-E4, E7-E8 |
| - API 冒烟 | api-smoke.spec.ts, users-list.spec.ts | 所有 GET 端点 |

## 待补全

| 手册分类 | 缺的用例 | 优先级 | 新建文件 |
|---------|---------|--------|---------|
| E. 权限控制 | E5-E6 显式授权/撤销（E2E） | 高 | permissions.spec.ts |
| H. 管理功能 | H1-H6 用户/部门/空间 CRUD 页面 | 高 | admin.spec.ts |
| F. 图谱 | F1-F3 关联图谱 | 中 | graph.spec.ts |
| G. 通知 | G1-G4 通知中心 | 中 | notifications.spec.ts |
| C. 组织架构 | C1-C3 部门/空间创建（E2E） | 中 | departments.spec.ts |
| B. 生命周期 | B10-B12 版本历史/软删除 | 低 | 并入 knowledge.spec.ts |

## 执行顺序

1. permissions.spec.ts — 直接针对本次发现的权限下拉问题
2. admin.spec.ts — 管理页面冒烟
3. graph.spec.ts, notifications.spec.ts — 辅助功能
4. departments.spec.ts — 组织架构创建流程
