# 应用商店上架指南

本文档为 **人格泡泡 (PersonaPop)** 应用上架 Google Play 和 Apple App Store 的完整指南。

---

## 目录

1. [准备工作](#准备工作)
2. [Google Play Store 上架](#google-play-store-上架)
3. [Apple App Store 上架](#apple-app-store-上架)
4. [审核注意事项](#审核注意事项)
5. [常见被拒原因及解决方案](#常见被拒原因及解决方案)

---

## 准备工作

### 通用素材清单

| 素材 | Google Play | App Store | 状态 |
|-----|-------------|-----------|------|
| 应用图标 | 512x512 PNG | 1024x1024 PNG | ⬜ |
| 手机截图 | 至少 2 张 | 至少 3 张（各尺寸） | ⬜ |
| 功能图/Banner | 1024x500 | 可选 | ⬜ |
| 简短描述 | 80 字符内 | 可选 | ⬜ |
| 完整描述 | 4000 字符内 | 4000 字符内 | ⬜ |
| 隐私政策 URL | ✅ 必需 | ✅ 必需 | ⬜ |
| 应用分类 | 生活时尚/娱乐 | 生活时尚/娱乐 | ⬜ |

### 开发者账号

| 平台 | 费用 | 注册链接 |
|-----|------|---------|
| Google Play | $25（一次性）| [play.google.com/console](https://play.google.com/console) |
| Apple Developer | $99/年 | [developer.apple.com](https://developer.apple.com/programs/) |

---

## Google Play Store 上架

### 步骤 1：注册开发者账号

1. 访问 [Google Play Console](https://play.google.com/console)
2. 使用 Google 账号登录
3. 支付 $25 注册费
4. 填写开发者信息

### 步骤 2：构建生产版本

```bash
# 构建 .aab 文件（Google Play 要求格式）
eas build -p android --profile production
```

构建完成后会提供下载链接。

### 步骤 3：创建应用

1. 在 Play Console 点击「创建应用」
2. 选择默认语言（简体中文）
3. 输入应用名称：`人格泡泡`
4. 选择应用类型：应用（非游戏）
5. 选择是否免费

### 步骤 4：填写商店信息

**主要商店详情：**
- 应用名称：人格泡泡
- 简短说明：发现你的 MBTI 人格，生成专属艺术卡片
- 完整说明：（见下方模板）
- 应用图标、截图、功能图

**应用分类：**
- 类别：生活时尚 或 娱乐
- 标签：MBTI、人格测试、心理

**联系方式：**
- 电子邮件（必填）
- 网站（可选）
- 电话（可选）

### 步骤 5：上传应用包

1. 进入「发布」→「生产」
2. 点击「创建新版本」
3. 上传 `.aab` 文件
4. 填写版本说明

### 步骤 6：完成内容分级

1. 进入「政策」→「应用内容」
2. 完成内容分级问卷
3. 填写隐私政策 URL
4. 声明广告情况

### 步骤 7：提交审核

```bash
# 或使用 EAS 自动提交
eas submit -p android
```

**审核时间：** 1-3 天（首次可能更长）

---

## Apple App Store 上架

### 步骤 1：注册开发者账号

1. 访问 [Apple Developer](https://developer.apple.com/programs/)
2. 使用 Apple ID 登录
3. 支付 $99/年
4. 等待审核通过（1-2 天）

### 步骤 2：构建 iOS 版本

```bash
# 构建 iOS 应用
eas build -p ios --profile production
```

> 注意：EAS 云构建不需要 Mac 电脑

### 步骤 3：在 App Store Connect 创建应用

1. 访问 [App Store Connect](https://appstoreconnect.apple.com)
2. 点击「我的 App」→「+」→「新建 App」
3. 填写信息：
   - 平台：iOS
   - 名称：人格泡泡
   - 主要语言：简体中文
   - 套装 ID：选择你的 Bundle ID
   - SKU：personapop001

### 步骤 4：填写应用信息

**App 信息：**
- 名称、副标题
- 类别：生活 或 娱乐
- 内容版权

**定价和销售范围：**
- 价格：免费
- 销售范围：选择国家/地区

**App 隐私：**
- 隐私政策 URL
- 数据收集声明

### 步骤 5：准备提交

**版本信息：**
- 截图（必须符合各设备尺寸）
- 宣传文本
- 描述
- 关键词
- 技术支持 URL
- 营销 URL（可选）

**构建版本：**
- 上传或选择构建版本
- 填写新功能介绍

### 步骤 6：提交审核

```bash
# 或使用 EAS 自动提交
eas submit -p ios
```

**审核时间：** 1-7 天

---

## 审核注意事项

### Google Play 审核要点

1. ✅ 隐私政策必须包含数据收集说明
2. ✅ 权限使用必须有合理说明
3. ✅ 应用不能频繁崩溃
4. ✅ 内容必须符合分级
5. ✅ 不能有误导性描述

### Apple 审核要点（更严格）

1. ✅ UI 必须符合 Human Interface Guidelines
2. ✅ 应用必须功能完整（不能是 demo）
3. ✅ 登录功能必须提供测试账号
4. ✅ 必须使用 Apple 登录（如果有第三方登录）
5. ✅ 截图必须真实反映应用功能
6. ✅ 隐私说明必须完整准确

---

## 常见被拒原因及解决方案

### Google Play

| 被拒原因 | 解决方案 |
|---------|---------|
| 隐私政策不完整 | 补充数据收集、使用、分享说明 |
| 权限未说明 | 在描述中说明为什么需要该权限 |
| 应用崩溃 | 充分测试后再提交 |
| 元数据违规 | 移除误导性描述或关键词堆砌 |

### Apple App Store

| 被拒原因 | 解决方案 |
|---------|---------|
| 功能不完整 | 确保核心功能完整可用 |
| 需要登录但无测试账号 | 在审核备注中提供测试账号 |
| 截图不准确 | 使用真实应用截图 |
| 缺少隐私说明 | 完善 App Privacy 部分 |
| UI 问题 | 遵循 Apple HIG 设计规范 |

---

## 应用描述模板

### 简短描述（80字符内）

```
发现你的 MBTI 人格类型，生成专属手绘风格人格卡片！
```

### 完整描述

```
🎨 人格泡泡 - 你的 MBTI 人格艺术家

发现你独特的人格魅力，生成专属的手绘风格人格卡片！

✨ 核心功能：
• MBTI 人格测试 - 科学的问卷帮你发现真实的自己
• 16 种人格类型 - 每种都有独特的解读和趣味描述
• AI 人格洞察 - 深度分析你的人格特点
• 艺术卡片生成 - 多种风格，打造专属视觉名片
• 一键分享 - 与朋友分享你的人格魅力

🎯 适合人群：
• 想深入了解自己的你
• 对 MBTI 感兴趣的探索者
• 喜欢分享个性的社交达人
• 寻找心灵共鸣的小伙伴

🌈 特色风格：
• 赛博朋克 - 霓虹未来
• Emo 时刻 - 黑白孤独  
• 火力全开 - 亮片模糊
• 森系治愈 - 阳光胶片
• 梦核 - 粉色怀旧

开始你的人格探索之旅吧！

---
如有问题或建议，欢迎联系我们：support@example.com
```

---

## EAS 自动提交配置

在 `eas.json` 中配置：

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "production"
      },
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
```

### 获取 Google Play Service Account Key

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建服务账号
3. 下载 JSON 密钥
4. 在 Play Console 中授权该服务账号

### 获取 Apple 配置

1. `appleId`: 你的 Apple ID 邮箱
2. `ascAppId`: App Store Connect 中的应用 ID
3. `appleTeamId`: 开发者团队 ID

---

## 建议上架顺序

1. **先上 Google Play**
   - 审核快、费用低
   - 积累经验

2. **再上 App Store**
   - 审核严格
   - 需要更多准备

---

## 检查清单

### 提交前检查

- [ ] 应用无崩溃和明显 bug
- [ ] 所有功能正常工作
- [ ] 隐私政策已上线
- [ ] 截图真实准确
- [ ] 描述无误导性内容
- [ ] 版本号正确
- [ ] 测试账号准备好（如需要）

### 素材检查

- [ ] 应用图标符合规格
- [ ] 截图数量和尺寸正确
- [ ] 功能图/Banner 准备好
- [ ] 描述文案完成
- [ ] 关键词列表准备好

---

*最后更新：2026-02-02*
