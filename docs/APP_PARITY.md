# APP 用户端功能对照与验收

日期：2026-09-17  
对照源码：E:/工作/0912-爱爱短剧（只读，未修改）

## 页面范围

| WEB 用户端能力 | APP 页面 / 路径 | 实现 |
| --- | --- | --- |
| 推荐、短剧、漫剧 | /，/shorts，/comics | 保留首页；筛选与更多入口可用 |
| 榜单、专题、免费、追更 | /rankings，/collections，/free，/updates | 榜单按展示热度排序；专题与更新列表；免费内容待服务确认 |
| 搜索 | 首页/刷剧/专区搜索抽屉 | 剧名/题材过滤、空结果、独立专区范围 |
| 剧目详情 | /detail/:id | 参考图 1：海报、信息、进度、全部集数、简介、评论、推荐 |
| 播放 | /play/:id?episode=1 | 参考图 2：独立黑底播放页、互动栏、选集/进度/倍速 |
| 登录、注册、找回密码 | 全局弹窗及 /account/login 等入口 | HTTP 确认会话，错误保留输入，草稿续接 |
| 邮件重置、邮箱验证 | /account/reset-password，/account/verify | token 缺失提示、密码校验、实际请求后显示结果 |
| 个人中心与资料 | /me，/me/profile | 资料读取/保存，本地头像更换/恢复 |
| 追剧、收藏、观看历史 | /following，/me/favorites，/me/history | 共用本地状态；远端历史合并、单条/全部删除 |
| 我的评论与消息 | /me/comments，/me/messages | 读取、删除、消息筛选、已读与跳转 |
| 会员与订单 | /membership，/checkout，/payment-result，/me/orders，/me/orders/:id | 报价、有效期校验、幂等创建、支付跳转、状态查询 |
| 帮助与工单 | /support，/support/:topic，/support/feedback，/support/tickets，/support/tickets/:id | 帮助展开、表单校验、工单提交与详情 |
| 隐私、设置、协议 | /settings，/me/privacy，/privacy，/terms，/membership-guide，/copyright，/about | 可访问内容页及记录/账号管理入口 |
| 18+专区 | /18plus 及专区详情/播放 | 保留主动访问确认，深链接不可绕过；收藏可筛选，普通列表不展示专区内容 |

WEB 的开发预览控制、内容运营后台不是 APP 用户端页面，未迁入手机界面。协议说明为当前产品行为说明，正式运营文本由项目方最终确认。

## 主要修复

1. 移除手机号格式正确即假登录、评论未提交却提示已发送、分享/账号等按钮只弹“已打开”的占位行为。
2. 详情与播放分离，不再对全部作品播放同一段演示视频。
3. 选集显示完整数量，修复此前最多 36 集及最少 12 集的硬编码；非法集数参数取整并限制在有效范围。
4. 播放切集提交 episodeId；无片源/鉴权失败不创建 video，显示可重试/会员入口。播放凭证过期可重载。
5. 喜欢、追剧、收藏与历史共用状态；取消最后一条追剧后不会重新生成默认记录。
6. 首页续看使用真实本机播放记录；历史按时间排序去重；游客与不同账号互相隔离。
7. 评论按剧目和集数加载；保留草稿；显示子回复；支持热门/最新、剧透、点赞、本人删除、举报与分页。
8. 修改播放返回重复详情的历史栈；保留从详情返回时首页的原滚动位置。
9. 模态框支持 Esc、Tab 循环焦点、关闭后焦点恢复；认证弹层打开时详情区域不可操作。
10. 损坏本地缓存恢复为空记录；网络断开、无效剧目、畸形编码、空列表有明确状态。
11. 头像限制格式/大小并验证图片可读取；支付仅信服务端订单状态，不信返回地址上的成功标记。

## 后端契约和限制

HTTP 客户端：src/services/api.ts。所有请求到同源 /api/v1，credentials=same-origin，非 GET 携带页面 csrf-token meta 中的值，12 秒超时。会话 401 会清除客户端账号状态。

沿用 WEB：session、auth/sign-in、auth/register、auth/password-reset、auth/password-reset/confirm、me/profile、comments 及点赞/举报/删除、green/adult 内容详情和 playback、me/watch-progress、privacy/green/history、me/notifications、membership/quotes、orders、support/tickets。

新增适配要求：
- GET /me/comments 返回当前用户的 Comment[]；WEB 的对应入口此前为空状态，尚无该接口实现。
- POST /auth/verify 接收 token；只有真实成功才显示邮箱验证完成。
- playback POST body 增加 episodeId；后端需返回该集的 sources、expiresAt、previewEpisodeIds。不同集不可被服务端错误映射到同一演示源。
- 内容详情 preview_episode_ids 用于显示“可试看/需解锁”，不构成授权；播放访问仍由服务端决定。

真实认证、支付、内容授权、正式片源、工单及云端服务需要后端接入。回归中的模拟服务仅验证前端行为，不证明真实服务上线。生产界面没有模拟登录、支付成功入口；测试视频只由自动化拦截的 playback 响应引用。静态 public 仍保留原项目测试素材。

## 验收证据

npm run build：TypeScript 与生产构建通过。

npm run verify：10 组检查通过，页面 JavaScript 异常为 0：
- 360 / 390 / 430px 首页、详情完整选集、播放错误态、浏览器返回。
- 未接服务时不能假登录；评论草稿关闭和刷新保留；找回密码失败状态。
- 模拟认证后的评论发布、审核态、回复、热门/最新、点赞、删除与草稿隔离。
- 模拟片源下的视频加载、进度保存、倍速、切集、跨页收藏与刷新持久化。
- 模拟个人资料保存、报价/订单/支付结果、工单提交、消息已读跳转。
- 25 个用户页面巡检、无效剧目及专区深链接访问确认。
- 重置链接、密码不一致、畸形订单编码、小数集数、头像上传/恢复、专区收藏一致性、模态焦点、360×640 小屏。
- 403 锁定播放、接口失败不能伪装为空评论、损坏缓存恢复。

报告：verification-parity.json。截图：screenshots/parity/。
名称含 mocked 的图片明确使用测试数据；其余截图为未接后端的实际页面状态。

尚需真实环境验证：实际账号与注册邮件、后端 CSRF/Cookie 部署、支付供应商与回调、正版片源/各集映射、HLS 在目标 WebView 的解码支持、iOS/Android 真机媒体权限与软键盘。当前播放器使用浏览器原生 video，可播放格式取决于目标浏览器；未接入额外 HLS 解码库。

生产预览复验：2026-09-17 在 http://127.0.0.1:4173/ 对 dist 构建重复执行同一 10 组回归，全部通过，页面 JavaScript 异常为 0。
