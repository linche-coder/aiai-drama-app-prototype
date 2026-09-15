# 爱爱短剧 APP 高保真交互原型

在现有代码上持续迭代的移动端原型。技术栈为 React 19 + TypeScript + Vite，Motion 负责转场与拖拽，Lucide React 提供统一图标。

## 启动

```powershell
npm.cmd install
npm.cmd run dev
```

开发地址以终端输出为准，默认 `http://localhost:5173`。生产构建：

```powershell
npm.cmd run build
npm.cmd run preview
```

## 本期范围

- WEB 同源分层品牌开屏：约 1.55 秒显现、0.4 秒停留、360ms 整层淡出；同一会话仅播放一次，桌面演示面板可重播。
- 首页搜索与会员、频道切换、竖版 Cover Flow、续看、热门趋势、最新上架与更多推荐。
- 本地搜索（有结果 / 无结果）、剧目预览、会员占位弹层。
- “刷剧”提供可上下吸附的视频流：自动播放、单击暂停、双击点赞、收藏、评论抽屉、分享反馈、进度拖动与会话状态保留。
- 首页 / 刷剧 / 18+专区 / 追剧 / 我的五栏导航；18+、追剧与我的保持范围明确的占位页。
- 桌面端提供独立演示控制：360 / 390 / 430 宽度和新用户 / 有记录切换。

本项目不含后端、真实登录、支付、会员购买、年龄验证或正式剧集视频。

## 设计规范

- 品牌色：`#FC2F68`、`#EE35EF`、`#9E24FF`，辅以少量 `#FE882B` 暖色光，均取自品牌 SVG。
- 背景：`#08090D`；一级表面 `#111017`；正文 `#FBF9FF`；次级文字 `#AAA3B4`。
- 字体：系统中文无衬线优先（苹方 / 微软雅黑），正文 14–16px，标题 18–26px。
- 间距：4px 基础节奏，页面水平留白 16px；卡片圆角 14–24px。
- 动效：普通反馈 180–220ms，页面/弹层 280–420ms，Cover Flow 弹簧拖拽；系统减少动态效果开启时，开屏改为约 220ms 简单淡入淡出。

## 素材与交接

- `public/assets/brand/logo-full.svg`、`logo-mark.svg`：用户提供的原始 SVG，未重绘路径。
- `src/assets/intro-logo.svg`：来自 WEB 端的可分层开屏 SVG；仅对 DOM `id` 做实例隔离，路径未修改。
- `public/assets/covers/`：复用 `E:\工作\0912-爱爱短剧` 已整理的本地封面；原始来源目录为 `E:\工作\0907-短剧封面`。
- `public/media/demo/portrait.mp4`：本地中性测试视频，仅用于验证播放、暂停、预加载和进度逻辑；界面以剧目封面作为主预览画面，正式交付前应替换为已授权的 9:16 剧集片段。
- 剧名、集数、更新状态、简介和观看进度均为本地交互演示数据，不代表真实上架或热度。
- 正式系统级启动画面需由 iOS / Android APP 工程师实现；本项目只演示应用内品牌动画。

## 验收与截图

运行 `node scripts/verify-prototype.mjs` 可执行本地 Chrome 回归。主要截图位于 `docs/screenshots/`：`01-splash-390.png`、`home-360.png`、`home-390.png`、`home-430.png`、`reels-390.png`、`adult-placeholder.png`、`search-result.png`、`search-empty.png`、`drama-preview.png` 与桌面演示控制截图。
