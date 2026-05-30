# Hyphen 上架 & EAS Production Build 清单

API 正式地址：`https://api.hyphenjob.com`

---

## 一、上架前账号（必做）

| 平台 | 费用 | 链接 |
|------|------|------|
| **Apple Developer** | USD $99/年 | [developer.apple.com](https://developer.apple.com) |
| **Google Play Console** | USD $25 一次性 | [play.google.com/console](https://play.google.com/console) |
| **Expo / EAS** | 免费档可 build；Submit 需 Expo 账号 | [expo.dev](https://expo.dev) |

在 Mac 安装并登录 EAS CLI：

```bash
npm install -g eas-cli
eas login
cd /Users/kirafilm/Desktop/Hyphen-app
eas whoami
```

---

## 二、EAS 环境变量（Secrets）

Production build **不会**读取本机 `.env`，需在 EAS 云端配置：

```bash
cd /Users/kirafilm/Desktop/Hyphen-app

# 必填 — Supabase 登录
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://你的项目.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "你的anon_key"

# 必填 — RevenueCat 正式 Key（不要用 Test Store key）
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value "appl_xxxx"
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value "goog_xxxx"

# 可选 — EmailJS（若联系页走客户端；目前多走 API 可略）
# eas secret:create --scope project --name EXPO_PUBLIC_EMAILJS_SERVICE_ID --value "..."
```

查看已配置：

```bash
eas secret:list
```

`EXPO_PUBLIC_API_BASE_URL` 已在 `eas.json` 的 production profile 写死为 `https://api.hyphenjob.com`。

---

## 三、RevenueCat 正式环境

1. [RevenueCat Dashboard](https://app.revenuecat.com) → 项目 → **Apps**
2. 连接 **App Store Connect**（iOS）与 **Google Play**（Android）
3. 创建 Entitlement：`pro`（与代码 `REVENUECAT_ENTITLEMENT_ID` 一致）
4. 创建 Offering / Package，并在 App Store / Play 建好对应 **内购产品 ID**
5. 复制 **Public API Key**（iOS `appl_`、Android `goog_`）到 EAS secrets

---

## 四、Supabase 生产配置

1. [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → **URL Configuration**
2. **Site URL**：可填 `https://hyphenjob.com` 或暂用 Expo scheme
3. 若用邮件重设密码，**Redirect URLs** 加入 App deep link（见 `app.config.ts` 的 `scheme`）
4. 确认 Email 登录已启用

---

## 五、Apple（iOS）清单

### 5.1 App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** 新建 App
2. 填写：
   - **Name**：Hyphen自由職（或 Hyphen）
   - **Bundle ID**：与 `app.config.ts` 一致 → `space.manus.freehunter.app.t20260427031216`
   - **SKU**：任意唯一字符串，如 `hyphen-ios-001`
3. 记录 **Apple ID**（数字，Submit 时用）

### 5.2 首次 EAS iOS Build

```bash
cd /Users/kirafilm/Desktop/Hyphen-app
eas build --platform ios --profile production
```

- 首次会提示创建 **Distribution Certificate**、**Provisioning Profile** → 选 **Yes** 让 EAS 管理
- 需 Apple Developer 账号已激活

Build 完成后在 [expo.dev](https://expo.dev) 下载 `.ipa` 或直接用 submit。

### 5.3 提交 App Store

```bash
eas submit --platform ios --profile production
```

按提示选刚 build 的 artifact，或关联 App Store Connect App ID。

### 5.4 App Store 元数据（Connect 里填）

| 项目 | 说明 |
|------|------|
| 截图 | 6.7"、6.5"、5.5" iPhone（至少各 3 张） |
| 描述 | 自由职业职位平台简介 |
| 关键词 | 自由職、freelance、接案… |
| 隐私政策 URL | 需可公开访问（可托管 `app/privacy.tsx` 内容到网站） |
| 支持 URL | 联系页或官网 |
| 年龄分级 | 问卷填写 |
| 加密 | 已在 Info.plist 声明 `ITSAppUsesNonExemptEncryption: false` |

**隐私政策**：商店要求 **HTTPS 网页链接**，不能只填 App 内路由。可放 `https://hyphenjob.com/privacy` 或 GitHub Pages。

---

## 六、Google Play（Android）清单

### 6.1 Play Console

1. 创建应用 → 填写名称 **Hyphen自由職**
2. **Package name** 须与 `app.config.ts` 一致：`space.manus.freehunter.app.t20260427031216`（创建后不可改）

### 6.2 首次 EAS Android Build

```bash
eas build --platform android --profile production
```

产出 **AAB**（Google Play 要求 AAB，EAS production 默认如此）。

### 6.3 提交 Play Store

**方式 A — 手动：** 在 Play Console → **Production** → 上传 AAB

**方式 B — EAS Submit：** 需 Google Service Account JSON：

1. Play Console → Setup → **API access** → 链接 GCP 项目
2. 创建 Service Account，授予 **Release manager**
3. 下载 JSON，保存为项目外路径（**不要 commit**）
4. ```bash
   eas submit --platform android --profile production
   ```

### 6.4 Play 元数据

| 项目 | 说明 |
|------|------|
| 截图 | 手机至少 2 张 |
| 简短 / 完整描述 | 与 iOS 类似 |
| 隐私政策 URL | 同上 |
| 内容分级 | 问卷 |
| 数据安全表单 | 声明收集 email、推送 token 等 |

---

## 七、Build 命令速查

```bash
cd /Users/kirafilm/Desktop/Hyphen-app

# 内测（真机安装，非 Dev Client）
eas build --platform ios --profile preview
eas build --platform android --profile preview

# 正式上架
eas build --platform ios --profile production
eas build --platform android --profile production

# 双平台一起
eas build --platform all --profile production

# 查看 build 状态
eas build:list
```

---

## 八、上架前自测（Production / Preview build）

在 **真机** 安装 preview 或 production build 后逐项确认：

- [ ] 打开 App，首页加载职列表
- [ ] Supabase 邮箱 **登录 / 注册**
- [ ] **发佈新工作**（含新类别：室內設計、音樂製作）
- [ ] **推送通知**（设置页开启 → 另一账号发职 → 收到推送）
- [ ] **联系表单** 送出成功
- [ ] **订阅 / Paywall**（RevenueCat 沙盒或正式内购）
- [ ] 浅色 / 深色主题
- [ ] 隐私政策、使用条款页可打开
- [ ] 管理员账号 moderation 功能（若适用）

---

## 九、版本号

| 字段 | 位置 | 当前 |
|------|------|------|
| `version` | `app.config.ts` | `0.1.0` |
| iOS build number | EAS `autoIncrement` + remote | 自动递增 |
| Android versionCode | EAS `autoIncrement` | 自动递增 |

发新版本时改 `app.config.ts` 的 `version`（如 `0.1.1`），再跑 production build。

---

## 十、常见错误

| 问题 | 处理 |
|------|------|
| Build 里 API 连不上 | 检查 EAS secret / `eas.json` 的 `EXPO_PUBLIC_API_BASE_URL` |
| 登录失败 | Supabase URL/Key 是否写入 EAS secrets |
| iOS 证书错误 | `eas credentials` 重新配置 |
| RevenueCat 无套餐 | Dashboard 产品 ID 与 Store 内购 ID 一致 |
| 推送收不到 | 真机 + 生产 build；Expo projectId 已在 `app.config.ts` |

---

## 十一、建议顺序（本周）

1. ✅ HTTPS API（已完成）
2. 注册 Apple Developer + Google Play（若未有）
3. `eas secret:create` 填入 Supabase + RevenueCat
4. `eas build --platform ios --profile preview` 真机测一轮
5. RevenueCat + 内购产品配置完成
6. 准备隐私政策 **网页 URL** + 截图
7. `eas build --profile production` → Submit

需要协助时可指定步骤（例如：「帮我写 privacy 网页」或「RevenueCat 产品怎么建」）。
