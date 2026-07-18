# Hyphen 上架 & EAS Production Build 清單

| 服務 | 正式地址 |
|------|----------|
| API | `https://api.hyphenjob.com` |
| 網站 | `https://hyphenjob.com` |
| 私隱政策 | `https://hyphenjob.com/privacy/` |
| 使用條款 | `https://hyphenjob.com/terms/` |

Bundle ID / Package name（建立後不可改）：`space.manus.freehunter.app.t20260427031216`

---

## 一、上架前帳號（必做）

| 平台 | 費用 | 連結 |
|------|------|------|
| **Apple Developer** | USD $99/年 | [developer.apple.com](https://developer.apple.com) |
| **Google Play Console** | USD $25 一次性 | [play.google.com/console](https://play.google.com/console) |
| **Expo / EAS** | 免費檔可 build；Submit 需 Expo 帳號 | [expo.dev](https://expo.dev) |

在 Mac 安裝並登入 EAS CLI：

```bash
npm install -g eas-cli
eas login
cd /Users/kirafilm/Desktop/Hyphen-app
eas whoami
```

---

## 二、EAS 環境變數

Production build **不會**讀取本機 `.env`，需在 EAS 專案環境設定：

```bash
cd /Users/kirafilm/Desktop/Hyphen-app

# 查看已配置
eas env:list

# 新增（示例）
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://你的项目.supabase.co" --environment production
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "你的anon_key" --environment production
eas env:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value "appl_xxxx" --environment production
eas env:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value "goog_xxxx" --environment production
```

| 變數 | 必填 | 說明 |
|------|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | Supabase 專案 URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | ✅ | RevenueCat iOS Public Key（`appl_`，勿用 `test_`） |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | ✅ | RevenueCat Android Public Key（`goog_`） |
| `EXPO_PUBLIC_API_BASE_URL` | ✅ | 已在 `eas.json` production 設為 `https://api.hyphenjob.com` |

---

## 三、VPS API 環境變數（`/opt/hyphen-app/.env`）

Production API（`NODE_ENV=production`）需在 VPS 設定：

```env
# 資料庫
DATABASE_URL=mysql://...
JWT_SECRET=...

# Supabase（伺服器驗證 JWT）
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 帳戶刪除必填；見下方 Supabase 取得方式
# 或使用新版 Secret key（二選一）：
# SUPABASE_SECRET_KEY=sb_secret_...

# RevenueCat — App 訂閱同步（必填）
REVENUECAT_SECRET_API_KEY=sk_...
REVENUECAT_PROJECT_ID=proj_...
REVENUECAT_WEBHOOK_AUTHORIZATION=自訂密鑰（建議設定）

# Stripe — 網頁訂閱（若開放 web paywall）
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 網站 URL（Stripe 回跳、郵件連結）
EXPO_PUBLIC_WEB_URL=https://hyphenjob.com
```

部署 API：

```bash
ssh ubuntu@43.156.132.120
cd /opt/hyphen-app
git pull
sudo docker compose -f docker-compose.prod.yml --profile https up -d --build api
curl https://api.hyphenjob.com/api/health
```

### 安全：`debugActivate` 已關閉

`subscription.debugActivate` 在 **`NODE_ENV=production` 正式環境已禁用**，防止偽造訂閱。App 訂閱必須走：

1. App Store / Google Play 購買 → RevenueCat
2. API `syncFromStore` 或 `subscription.me` 自動向 RevenueCat 查詢

本地開發（`NODE_ENV=development`）仍可使用 `debugActivate`。若 staging 需暫時開啟，可設 `ALLOW_DEBUG_SUBSCRIPTION=true`（**勿在 production VPS 使用**）。

---

## 四、RevenueCat 正式環境

1. [RevenueCat Dashboard](https://app.revenuecat.com) → 專案 → **Apps**
2. 連接 **App Store Connect**（iOS）與 **Google Play**（Android）
3. **Entitlement Identifier**：`Hyphen Pro`（與程式碼 `REVENUECAT_ENTITLEMENT_ID` 一致，**不是** `pro`）
4. 產品 ID（與商店一致）：
   - 月費：`hyphen_pro_monthly`（Google Play 可能顯示 `hyphen_pro_monthly:p1m`）
   - 年費：`hyphen_pro_yearly`
5. 建立 Offering / Package 並設為 **Current**
6. 複製 **Public API Key**（iOS `appl_`、Android `goog_`）到 EAS 環境變數
7. 設定 **Webhook** 指向 API（並在 VPS 設 `REVENUECAT_WEBHOOK_AUTHORIZATION`）

### App 顯示優惠價 vs 實際扣款

Paywall UI 顯示「平台新上線特價優惠」（~~HK$288~~ **HK$128/月**、~~HK$2,888~~ **HK$1,328/年**）。  
**實際 App 內購扣款以 Google Play / App Store 定價為準**；若要真收優惠價，需在 Play Console / App Store Connect 設定對應價格或 introductory offer。  
網頁版 Stripe 優惠價需在 Stripe Dashboard 建立對應 Price ID 並寫入 VPS `.env`。

---

## 五、Supabase 生產配置

1. [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → **URL Configuration**
2. **Site URL**：`https://hyphenjob.com`
3. **Redirect URLs** 加入：
   - `https://hyphenjob.com/login`
   - App deep link：`manus20260427031216://login`（scheme 來自 `app.config.ts`）
4. 確認 Email 登入已啟用
5. 在 production 測試：**註冊、登入、忘記密碼**

---

## 六、Apple（iOS）清單

### 6.1 App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** 新建 App
2. 填寫：
   - **Name**：Hyphen自由職
   - **Bundle ID**：`space.manus.freehunter.app.t20260427031216`
   - **SKU**：任意唯一字串，如 `hyphen-ios-001`
3. 記錄 **Apple ID**（數字，Submit 時用）

### 6.2 EAS iOS Build

```bash
cd /Users/kirafilm/Desktop/Hyphen-app
eas build --platform ios --profile production
```

- 首次會提示建立 **Distribution Certificate**、**Provisioning Profile** → 選 **Yes** 讓 EAS 管理
- 需 Apple Developer 帳號已激活

### 6.3 提交 App Store

```bash
eas submit --platform ios --profile production
```

`eas.json` 已設定 `appleTeamId: 5MH48AUNP5`。

### 6.4 App Store 元數據

| 項目 | 說明 |
|------|------|
| 截圖 | 6.7"、6.5"、5.5" iPhone（至少各 3 張） |
| **副標題** | **不可含價格**（例如勿寫「特價 HK$128」）；可寫「自由職工作平台」 |
| 描述 | 自由職業職位平台簡介；**文末加** `使用條款：https://hyphenjob.com/terms/` |
| 關鍵字 | 自由職、freelance、接案… |
| 私隱政策 URL | `https://hyphenjob.com/privacy/` |
| **EULA** | App Description 放條款連結，或在 App Store Connect → **App 資訊 → EULA** 貼自訂條款 |
| 支援 URL | `https://hyphenjob.com/contact` 或聯絡頁 |
| 年齡分級 | 問卷填寫 |
| 訂閱說明 | App 內 paywall 已列：方案名稱、週期、價格、解鎖聯絡資訊、私隱＋條款連結 |
| 帳戶刪除 | **設定 → 刪除帳戶**（審核錄屏：註冊 → 設定 → 刪除 → 確認） |
| 加密 | 已在 Info.plist 聲明 `ITSAppUsesNonExemptEncryption: false` |

**審核被拒常見修正（2026-06）：**

1. 副標題移除所有價格／優惠字眼  
2. Paywall 訂閱說明（App 已加 `SubscriptionDisclosure`）  
3. Description 或 EULA 欄加入 `https://hyphenjob.com/terms/`  
4. VPS 設定 `SUPABASE_SERVICE_ROLE_KEY` 後 redeploy API（帳戶刪除）  
5. 已移除 `UIBackgroundModes` audio（刪除未使用的 expo-video / expo-audio plugin）

---

## 七、Google Play（Android）清單

### 7.1 Play Console

1. 建立應用 → 名稱 **Hyphen自由職**
2. **Package name**：`space.manus.freehunter.app.t20260427031216`（建立後不可改）

### 7.2 EAS Android Build

```bash
eas build --platform android --profile production
```

產出 **AAB**（Google Play 要求 AAB，EAS production 預設如此）。

### 7.3 提交 Play Store

**方式 A — 手動：** Play Console → **Production** → 上傳 AAB

**方式 B — EAS Submit：** 需 Google Service Account JSON：

1. Play Console → Setup → **API access** → 連結 GCP 專案
2. 建立 Service Account，授予 **Release manager**
3. 下載 JSON，保存於專案外路徑（**不要 commit**）
4. ```bash
   eas submit --platform android --profile production
   ```

### 7.4 Play 元數據

| 項目 | 說明 |
|------|------|
| 截圖 | 手機至少 2 張 |
| 簡短 / 完整描述 | 與 iOS 類似 |
| 私隱政策 URL | `https://hyphenjob.com/privacy/` |
| 內容分級 | 問卷 |
| 資料安全表單 | 聲明收集 email、推送 token 等 |

---

## 八、法律網頁部署

商店要求 **HTTPS 公開連結**。內容與 App 內 `app/privacy.tsx`、`app/terms.tsx` 一致。

```bash
cd /Users/kirafilm/Desktop/Hyphen-app
node scripts/build-legal-web.mjs
# 上傳 deploy/web/ 到 VPS — 詳見 deploy/WEB.md
```

---

## 九、Build 命令速查

```bash
cd /Users/kirafilm/Desktop/Hyphen-app

# 內測（真機安裝 APK / internal）
eas build --platform ios --profile preview
eas build --platform android --profile preview

# 正式上架
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production

# 查看 build 狀態
eas build:list
```

**注意：** `eas build` 只能在 **Mac** 執行，不要在 VPS 上跑。

---

## 十、上架前自測（Production / Preview build）

在 **真機** 安裝 preview 或 production build 後逐項確認：

- [ ] 打開 App，首頁載入職位列表
- [ ] Supabase 電郵 **登入 / 註冊**
- [ ] **忘記密碼**（郵件連結指向 hyphenjob.com，非 localhost）
- [ ] **發佈新工作**
- [ ] **訂閱 / Paywall** → 購買 → **解鎖聯絡資訊**
- [ ] **恢復購買**、個人頁 **同步訂閱狀態**
- [ ] **推送通知**（設定頁開啟 → 另一帳號發職 → 收到推送）
- [ ] **聯絡表單** 送出成功
- [ ] 淺色 / 深色主題
- [ ] 私隱政策、使用條款頁可打開
- [ ] 網頁 Stripe 訂閱（若已設定）
- [ ] 管理員 moderation 功能（若適用）

---

## 十一、版本號

| 欄位 | 位置 | 目前 |
|------|------|------|
| `version` | `app.config.ts` | `0.1.2` |
| iOS build number | EAS `autoIncrement` + remote | 自動遞增 |
| Android versionCode | EAS `autoIncrement` | 自動遞增 |

發新版本時改 `app.config.ts` 的 `version`，再跑 production build。

---

## 十二、常見錯誤

| 問題 | 處理 |
|------|------|
| Build 裡 API 連不上 | 檢查 EAS 環境變數 / `eas.json` 的 `EXPO_PUBLIC_API_BASE_URL` |
| 登入失敗 | Supabase URL/Key 是否寫入 EAS 環境變數 |
| 訂閱購買後仍顯示未訂閱 | VPS 是否設 `REVENUECAT_SECRET_API_KEY` + `REVENUECAT_PROJECT_ID`；App 是否用最新 production build；個人頁按「同步訂閱狀態」 |
| Entitlement 對不上 | RevenueCat Dashboard 必須是 **`Hyphen Pro`**，不是 `pro` |
| iOS 憑證錯誤 | `eas credentials` 重新配置 |
| RevenueCat 無套餐 | Dashboard 產品 ID 與 Store 內購 ID 一致；Offering 已發布 |
| 推送收不到 | 真機 + 生產 build；Expo projectId 已在 `app.config.ts` |
| Sandbox 訂閱很快過期 | Google Play 沙盒月費約 5 分鐘一周期；在 RevenueCat 顯示 Renewed 後 1–2 分鐘內測試 |

---

## 十三、建議順序

1. ✅ HTTPS API（`api.hyphenjob.com`）
2. ✅ Android 訂閱同步（RevenueCat + `Hyphen Pro`）
3. ✅ 關閉 production `debugActivate`
4. `git push` → VPS `git pull` + rebuild API
5. 註冊 Apple Developer + Google Play（若未有）
6. EAS 環境變數：Supabase + RevenueCat 正式 Key
7. Play / App Store 內購產品 + RevenueCat Offering + Webhook
8. 部署 `privacy/`、`terms/` 靜態頁
9. Supabase Redirect URLs + 忘記密碼實測
10. 準備商店截圖 + 文案
11. `eas build --profile production` → Submit
