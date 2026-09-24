# 爱爱短剧 APP

React 19 + TypeScript + Vite 移动端 Web 应用。业务基准已同步至 WEB 1.4.3；APP 保留竖屏布局、品牌开屏、底部导航、刷剧流和移动端弹层。

- 当前版本：`v1.4.3`
- 线上地址：<https://linche-coder.github.io/aiai-drama-app-prototype/>
- GitHub：<https://github.com/linche-coder/aiai-drama-app-prototype>

## 运行

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run verify
```

本地预览：`http://127.0.0.1:5173/`。支持 360 / 390 / 430px 预览宽度。

## 当前业务

- 首页：作品轮播、双节活动、继续观看、热门推荐、题材筛选、最新更新。
- 内容：18 部普通区预览内容，字段与 WEB 1.4.3 preview catalog 对齐；未知集数、状态、权限不会伪造。
- 刷剧：真人短剧、AI漫剧、推荐频道；喜欢、评论、追剧、分享与详情入口。
- 双节活动：`midautumn-national-2026`，活动页、邀请进度、APP 专享任务、会员加赠和奖励明细均依赖服务端确认。
- 会员：畅看月卡 ¥88、季卡 ¥188、永久会员 ¥388、220 永久积分 ¥10.9、一次性 24 小时体验。
- 积分：永久积分与会员积分分账，签到、会员积分兑换时长、解锁及退款明细。
- 18+专区：显式年龄复选确认、20 部横版封面、活动轮播、搜索兼容和会话级私密愿望榜。
- 个人中心：签到、积分、会员、订单、历史、追剧、评论、消息、隐私、帮助与反馈。

## 安全边界

正式认证、会员、订单、支付、积分、活动领奖、邀请、内容权限与播放凭证以 `/api/v1` 服务结果为准。接口不可用时显示失败和重试入口，不在本地伪造成功。普通区与18+专区数据隔离，私密内容不提供公开分享。

本地开发预览账号仅在 `import.meta.env.DEV` 且显式配置 `VITE_PREVIEW_*` 时可用，不进入生产构建。

详细同步与验收见 [docs/APP_PARITY.md](docs/APP_PARITY.md) 和 [docs/HANDOFF.md](docs/HANDOFF.md)。
