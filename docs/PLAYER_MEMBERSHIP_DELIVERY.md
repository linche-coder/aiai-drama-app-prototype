# 播放器精简与会员中心改版交付

日期：2026-09-18。直接修改现有 APP，保留此前工作；未修改参考 WEB 项目、未上线、未发起真实扣款。

## 修改内容与文件

| 文件 | 本轮修改 |
| --- | --- |
| src/components/DramaScreens.tsx | 移除播放器弹幕入口、容器及专用状态，移除头像追剧入口；保留评论、喜欢、收藏、分享和选集；增加直接倍速及全屏按钮；校验片源响应并改进错误提示 |
| src/hooks/usePlayerFullscreen.ts | 容器全屏、兼容能力检测、实际状态事件、Esc 退出、倍速恢复及失败反馈 |
| src/components/MembershipCenter.tsx | 紧凑品牌状态、月/年周期、两档套餐、权益对比、积分包、演示订单摘要、登录后恢复选择、原商品报价入口 |
| src/data/membershipOffers.ts | 独立的新方案演示商品与原商品目录，不混用商品 ID |
| src/components/CommerceScreens.tsx | 原有真实报价/订单接口复用，价格变化确认、订阅独立确认、防重复提交、过期重报价及取消/失败状态 |
| src/components/MoreScreens.tsx | 拆出会员/结算组件，更新服务说明 |
| src/components/Sheets.tsx | 复用现有面板及减少动态效果设置 |
| src/styles/product.css、refinement.css、src/main.tsx | 清除旧播放器样式，加入移动/横屏布局、会员视觉及安全区样式 |
| src/App.tsx | 会员及订单子页的底部导航正确归属“我的” |
| vite.config.ts、vite.config.js、.env.example | 可配置实际后端代理，两份现存配置保持一致 |
| scripts/verify-player-membership*.mjs | 专项与生产产物自动验收 |
| scripts/verify-product.mjs、verify-preview-accounts.mjs | 更新原回归以适配新界面，保留原能力检查 |

播放器使用原媒体实例与同一倍速状态；右上设置和底部入口同步。选择可先保存，元数据到达后应用。速度选项为 0.75、1、1.25、1.5、2。进入/退出容器全屏不重建视频。右侧按钮保留四项，底部按钮触控区至少 44px。视频保持 contain 比例。

移除的追剧只是播放页入口，详情追剧和已有用户记录未清空。评论组件及接口未删除。未增加任何访问限制绕过路径。

## 会员商品映射与边界

| 类型 | 当前实现 | 是否可真实结算 |
| --- | --- | --- |
| basic-month / premium-month / premium-quarter | 仍代表原基础月卡、高级月卡、高级季卡，价格由服务端报价 | 仅有效真实报价且规则齐备时走原结算 |
| demo-v2-joy-month / year | 悦享 ¥19.9/月、¥168/年，目标 320 积分/月 | 否，仅演示摘要 |
| demo-v2-prestige-month / year | 尊享 ¥39.9/月、¥328/年，目标 960 积分/月 | 否，仅演示摘要 |
| demo-v2-credits-* | 60/200/580/1500 积分，¥6/18/45/98 | 否，仅演示摘要 |

参考 WEB 的旧套餐为基础/高级等级，存在 19/29、39/49、99/129 的价格配置分支；没有找到新方案的积分、年卡和畅看券商品映射。因此未将旧商品 ID 改名出售新权益，也不按前端公式计算升级差价或续期。

页面清楚标注“新方案演示”“暂不出售”。320/960 积分、免费 40 积分、无广告、1080P、设备数、提前看、8 折及畅看券均为目标方案演示，尚未作为可售承诺。尊享继承悦享与否、年卡积分发放方式均待服务端确认。年卡说明标明积分发放规则待接入；年度比较金额为方案月价乘 12 的演示比较。未展示未经真实配置确认的划线原价、销量和永久保留承诺。

访客可查看并选择；登录后保留选择。免费状态不创建零元订单。有效/过期旧会员显示真实返回的旧等级与到期时间，避免假装新方案已生效。演示积分和会员使用不同订单摘要，不发送创建订单请求，不修改用户会员身份。18+ 仍要求年龄与地区确认和服务端授权。

原商品继续使用现有报价及订单 API；报价必须匹配商品、金额、币种、有效期。自动续费字段 autoRenew 和规则 renewalDescription 缺失时不允许提交；自动订阅和报价变化分别确认，均不默认勾选。支付成功只依据订单结果。

## 实际验收

- npm.cmd run build：通过 TypeScript 和 Vite 生产构建。
- node scripts/verify-player-membership.mjs：10 组专项通过，页面错误为 0。
- node scripts/verify-product.mjs：原项目 10 组回归通过，页面错误为 0。
- node scripts/verify-preview-accounts.mjs：普通/会员账号登录、刷新、状态及退出通过。
- node scripts/verify-player-membership-release.mjs：生产产物容器全屏内选集/倍速、外部退出状态同步、相同视频节点和时间/倍速保留、减少动态效果模式通过。

专项覆盖 360、390、430px 与 844×390 横屏：无横向溢出、底部控件无重叠、触控尺寸检查通过，长页面末项可滚动到购买栏上方。修复原回归发现的畸形订单详情链接被误当订单列表问题。

播放器五档速度均读取真实 HTMLVideoElement.playbackRate 验证。测试用可解码本地 MP4 实际播放，记录播放时间推进；测试中对公开 drama-08 的片源接口做拦截，返回该测试 MP4。切集、重试和全屏后速度保留；全屏选集及速度面板可操作。真实业务片源并未因此接通，测试素材没有成为正常运行的片源替代。

会员状态覆盖未登录、免费、有效、过期；周期/套餐/积分包金额、登录恢复、演示订单隔离、报价失败重试、变价确认、双击单次提交、取消/失败及待支付状态通过。订单/支付响应使用测试拦截，不代表真实支付联调完成。

原生 iOS 视频全屏仅实现能力检测和事件兼容，未在真实移动设备验收。原生全屏由系统接管，不能承载网页选集/倍速面板，需要退出后操作；容器全屏没有此限制。不声称所有移动浏览器均已通过。

机器可读报告：
- [专项结果](player-membership-verification.json)
- [生产产物结果](player-membership-release.json)
- [原回归结果](verification-parity.json)

## 修改后截图

下列均为实际浏览器截图，390px 视口：
- [指定专区播放器：真实后端未连接状态](screenshots/player-membership/private-player-390-service-error.png)
- [播放器：可播放测试素材](screenshots/player-membership/player-390-test-media.png)
- [会员月卡](screenshots/player-membership/membership-390-monthly.png)
- [会员年卡](screenshots/player-membership/membership-390-annual.png)
- [积分包](screenshots/player-membership/membership-390-credits.png)
- [演示订单摘要](screenshots/player-membership/membership-order-preview-390.png)
- [有效会员](screenshots/player-membership/membership-active-390.png)
- [过期会员](screenshots/player-membership/membership-expired-390.png)

其他适配截图：
- [360 播放器](screenshots/player-membership/player-360-test-media.png) / [430 播放器](screenshots/player-membership/player-430-test-media.png)
- [360 会员](screenshots/player-membership/membership-360-monthly.png) / [430 会员](screenshots/player-membership/membership-430-monthly.png)
- [横屏播放器](screenshots/player-membership/player-landscape-test-media.png)
- [会员滚动到底](screenshots/player-membership/membership-390-bottom.png)

## 播放异常定位及恢复

当前 5173 实测：
- GET /api/v1/session 返回 200 text/html，是 Vite 的页面回退，并不是会话 JSON。
- POST /api/v1/green/contents/drama-08/playback 返回 404。
- POST /api/v1/adult/contents/private-preview-2/playback 返回 404。
- GET /media/demo/portrait.mp4 返回 200 video/mp4，357101 字节，测试中可实际解码播放。

结论：正常页面未取得播放授权和片源，故不能播放，并非仅播放按钮或媒体解码问题。指定专区已通过 UI 完成访问确认后检查，未绕过权限。参考 WEB 的开发中间件只有样式认证等响应，其他业务返回 503，不能作为真实播放后端。

已修复：加入有效响应校验、明确 404 服务未连接说明和可重试交互；增加可配置代理。尚缺：运行中的实际内容/鉴权 API、有效会话配置、剧集对应且可访问的授权媒体地址。不能用前端制造这些内容权限。

恢复步骤：
1. 启动实际业务服务，确认上述会话和 playback 路由返回约定 JSON；配置 Cookie、CSRF、内容权限及每集地址，媒体还需允许浏览器访问。
2. 在本项目 .env.local 设置 AIAI_API_TARGET=实际后端源地址（参考 .env.example），重启 Vite。线上仍需部署同源 /api/v1 反向代理。
3. 退出本地样式预览账号后，以真实账号登录并完成必要访问确认。样式账号不能获取正式片源或购买。
4. 重新验证公开免费片源、受限剧集授权、媒体加载、切集和过期重试；接入新商品、权益、积分发放及订单报价规则后才能取消演示标识。

本地开发预览：http://127.0.0.1:5173/#/membership
生产产物预览：http://127.0.0.1:4173/#/membership

样式账号仅在开发预览中使用，从本地 .env.local 配置读取，不随仓库公开。

实现参考：[容器全屏 API](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)、[全屏状态事件](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event)。
