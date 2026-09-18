# 爱爱短剧 APP

React 19 + TypeScript + Vite 移动端项目。保留原有首页、品牌开屏与暗色粉紫风格，2026-09-17 对照 WEB 项目补齐用户端页面与交互。

## 运行

```powershell
npm install
npm run dev
npm run build
npm run preview
```

本次本地预览地址：`http://127.0.0.1:5173/`。手机布局支持 360 / 390 / 430px，桌面提供手机预览框。

## 已完成

- 参考图 1 的独立详情页：海报信息、续看进度、完整选集、剧透折叠、评论与相似推荐。
- 参考图 2 的独立播放页：黑底适配视频比例、暂停/播放、上一集/下一集、选集抽屉、进度、倍速、喜欢/追剧/收藏/分享和评论。
- 账号登录、注册、找回密码、邮件重置与验证页；账号状态只认可 HTTP 接口结果。
- 个人资料、本地头像、观看记录、追剧/收藏、我的评论、消息、设置、隐私与退出登录。
- 会员报价、确认订单、支付跳转、订单列表/详情/结果查询。
- 榜单、专题、免费专区状态页、追更日历、帮助、反馈工单及协议说明。
- URL 路由与浏览器返回、评论草稿、空/错误状态、重复提交防护、模态焦点、专区深链接确认。

## 服务边界

与 WEB 一样，正式认证、正片、支付、通知及云端互动服务尚未接通。所有远端请求使用同源 `/api/v1`，部署时应由同一站点反向代理后端，并由服务提供会话 Cookie 与 CSRF 元信息。

访客及各账号的追剧、收藏、喜欢和观看记录按用户分开保存在本机；已登录用户的播放进度同时尝试同步后端，失败时保留本机记录。头像保存在本机，评论草稿保存在当前会话。不会把本地状态伪装为登录、发布或付款成功。目录仍使用已有展示资料，集数/热度等不是线上内容库的验真结果；锁定信息只在内容接口返回试看范围后显示。

`/me/comments` 和 `/auth/verify` 是为补齐 WEB 对应入口保留的接口扩展；播放请求增加 `episodeId` 参数，后端应按该参数返回当前集片源。其它主要接口沿用 WEB 的 DTO/路径。未实现伪造短信、充值、支付回调或正式片源。

当前是移动端 Web 应用，没有生成原生 Android/iOS 安装包。没有修改 WEB 源码或发布线上版本。

## 验证

启动开发服务器后执行：

```powershell
npm run verify
```

验证生产预览时可设置 `APP_TEST_URL=http://127.0.0.1:4173/`。回归使用已安装 Chrome 的无头模式，接口模拟只存在于测试脚本，应用运行时代码没有模拟账号或成功响应。

- [功能对照与验收](docs/APP_PARITY.md)
- [自动化报告](docs/verification-parity.json)
- 截图：`docs/screenshots/parity/`。名称含 `mocked` 的截图使用测试接口/测试视频，不代表正式服务已上线。

## 主要文件

- `src/App.tsx`：页面与弹窗路由、底部导航。
- `src/components/DramaScreens.tsx`：详情、播放、选集。
- `src/components/Comments.tsx`：评论、回复、剧透、点赞、举报。
- `src/components/AuthSheet.tsx` / `AuthLinkPage.tsx`：认证与邮件链接。
- `src/components/AccountScreens.tsx`：个人中心、资料、历史、收藏、消息。
- `src/components/MoreScreens.tsx`：目录、会员订单、帮助反馈与政策页。
- `src/state/appState.tsx`：真实会话与按账号隔离的本地记录。
- `src/services/api.ts`：HTTP 客户端、超时、错误与失效处理。
- `src/styles/product.css`：本轮新增页面与移动端样式。

## 本地样式测试账号（2026-09-18）
开发样式账号从未上传的 .env.local 读取 VITE_PREVIEW_USER、VITE_PREVIEW_VIP、VITE_PREVIEW_PASSWORD。仅使用本地测试值，不使用真实业务凭据。未配置时隐藏快捷入口；生产构建排除此能力。验证：node scripts/verify-preview-accounts.mjs。

## 播放器与会员中心更新（2026-09-18）
播放器已移除弹幕与头像追剧入口，新增底部倍速、容器全屏；会员中心改为月/年套餐和积分包布局。新方案独立标为演示，不接入真实支付。实际片源仍依赖后端服务。

详细修改、截图、验收结果和环境恢复方法见 [本轮交付说明](docs/PLAYER_MEMBERSHIP_DELIVERY.md)。此说明更新上文关于播放器入口和会员商品界面的旧描述。

## 最新界面反馈修订
个人中心新增直接退出账号，片单搜索增加上下间距，会员中心精简为套餐与积分内容并加入光效动画。购买未开放时仅在点击后提示，不创建订单。最新截图与验收见 [界面修订说明](docs/UI_POLISH_DELIVERY.md)；运行 `node scripts/verify-polish.mjs`。


## 版本 v1.1.0
2026-09-18 发布版，更新记录见 [CHANGELOG.md](CHANGELOG.md)。线上站点：https://aiai-drama-app.docile-shell-2494.chatgpt.site 。源码和版本标签托管于 https://github.com/linche-coder/aiai-drama-app-prototype 。正式业务后端仍需接入，当前发布不包含真实支付开通。

