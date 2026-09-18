# 2026-09-18 界面反馈修订

本轮按用户最新反馈更新，会员页面展示以本说明及 docs/screenshots/polish 为准，替代前一版冗长方案说明布局。

## 完成
- src/components/AccountScreens.tsx：在“我的”页面底部新增直接可见的“退出账号”。复用 DELETE /session 和 accept(null)，失败时保留登录状态并提示，可重试；提交锁防重复。保留设置中的退出登录。
- src/styles/refinement.css：片单搜索上下分别保留 16px / 20px 间距；会员套餐使用粉紫/青蓝描边及光晕、CSS/矢量皇冠、一次性入场和按钮扫光动画，支持减少动态效果。
- src/components/MembershipCenter.tsx：精简为标题、账户状态、周期、两档完整权益卡、免费方案、积分包和年卡。移除重复说明、旧套餐展开区域、主页面“演示”字样及多余装饰文案。原订单组件和接口保留；我的订单仍在个人中心。
- 选择和登录恢复复用原状态，不改变账户权益。参考图没有真实配置支持的划线原价、销量标签、永久解锁承诺未新增。使用“推荐”。
- 购买弹窗仅显示所选商品、金额、周期及“该方案暂未开放购买，当前不会创建订单或扣款”。尚未接通的商品继续隔离，不生成真实订单、不修改身份。

## 验收
npm.cmd run build 通过。
node scripts/verify-polish.mjs 通过，页面错误 0：
- 普通账号个人中心退出后刷新保持未登录。
- 会员账号设置页退出仍可用。
- 360/390/430px 搜索间距、会员无横向溢出、月年套餐与积分价格、未开放购买提示、末项滚动无遮挡。
- 访客登录后保留悦享年卡及金额。
- 减少动态效果模式关闭新增动画。

报告：[polish-verification.json](polish-verification.json)。
截图：[会员 390px](screenshots/polish/membership-390.png)、[追剧 390px](screenshots/polish/library-390.png)、[退出账号](screenshots/polish/logout-390.png)、[页面底部](screenshots/polish/membership-bottom-390.png)。同目录含 360/430px。

前一版专项脚本中有关旧套餐展开区、旧演示文案和按钮的断言不再适用，本轮界面回归使用 verify-polish.mjs；播放器代码本轮未改。实际播放服务、商品权益、支付接入和原生全屏真机验收仍保持上一轮的未完成状态。
