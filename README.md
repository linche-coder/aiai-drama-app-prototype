# 爱爱短剧 APP 移动端高保真原型

基于 React 19、TypeScript、Vite、Motion 和 Lucide React 构建。项目保留深黑紫背景、粉红—紫色品牌渐变、柔和环境光与克制玻璃质感，并已从单页展示扩展为可完整走查的移动端产品原型。

## 启动与验证

- 开发：`npm install` 后运行 `npm run dev`，访问 `http://localhost:5173/`。
- 构建：`npm run build`。
- 预览：`npm run preview`。
- 完整 Chrome 回归：`npm run verify`。

## 页面与流程

- 品牌开屏：冷启动一次，约 1.55 秒显现、0.4 秒停留、360ms 整层淡出；支持减少动态效果与桌面重播。
- 推荐：竖版 Cover Flow、继续观看、本周热榜、编辑精选、最新上架和猜你喜欢。
- 短剧：题材快捷筛选、状态/地区/排序复合筛选、结果数量与双列高密度浏览。
- 漫剧：独立精选头图、漫剧题材筛选、4:5 卡片和追更日历。
- 剧目详情：剧情信息、播放、追剧、选集、加载失败与重试。
- 刷剧：9:16 纵向吸附视频流、自动播放、暂停、点赞、收藏、评论、分享与进度。
- 18+专区：年龄确认、频道、精选、上新、收藏与退出。
- 追剧：追剧/收藏切换、更新提醒、继续观看和空状态。
- 我的：游客/登录状态、手机号登录、观看记录、会员权益与设置入口。
- 搜索：剧名/题材检索、有结果与无结果状态；离线时显示缓存内容提示。

## 视觉规范

- 基准宽度 390px，验收覆盖 360 / 390 / 430px。
- 页面边距 16px，小屏 14px。
- 背景 `#08090D`，主文字 `#FBF9FF`，辅助文字 `#AAA3B4`。
- 品牌渐变 `#FC486F → #EF35E5 → #9E38FF`。
- 卡片圆角 15–18px，控件圆角 10–14px。
- 底部导航 68px，并叠加 `env(safe-area-inset-bottom)`。
- 图标统一使用 Lucide；18+入口未选中为单色，选中恢复品牌 SVG 渐变。

## 主要文件

- `src/components/HomeScreen.tsx`：三频道差异化首页。
- `src/components/ProductScreens.tsx`：详情、播放、追剧、个人中心、登录与会员。
- `src/components/ReelsScreen.tsx`：沉浸式刷剧。
- `src/components/AdultScreen.tsx`：18+专区。
- `src/components/Sheets.tsx`：搜索、评论与通用底部抽屉。
- `src/data/`：本地内容数据。
- `src/styles/app.css`：设计令牌、组件和响应式样式。
- `scripts/verify-product.mjs`：浏览器回归与截图。

## 素材与范围

`public/assets/brand/` 保存品牌标识，`public/assets/covers/` 保存剧目封面，`public/assets/adult/` 保存专区素材，`public/media/demo/portrait.mp4` 用于验证播放交互。

剧名、简介、集数、热度、评论、观看进度和用户状态均为本地模拟数据；登录、会员、支付、内容服务、评论发布与跨设备同步未连接真实后端。系统级启动画面需由 iOS / Android 工程师实现，本项目实现应用内品牌开屏。

## 截图

最终截图位于 `docs/screenshots/final/`，包括开屏、三种宽度首页、短剧筛选、漫剧、详情、刷剧、18+专区、追剧、个人中心、会员、搜索结果与空状态。