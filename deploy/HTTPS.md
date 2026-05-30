# 域名 + HTTPS 部署指南（Hyphen API）

用 **Caddy** 自动申请 Let's Encrypt 证书，把 `https://api.你的域名.com` 转发到 Docker 里的 `api:3000`。

---

## 你需要准备

| 项目 | 说明 |
|------|------|
| 域名 | 任意注册商（腾讯云 DNSPod、Cloudflare、Namecheap 等） |
| 子域名 | 建议 `api.你的域名.com`（只给 API 用） |
| VPS IP | `43.156.132.120` |
| 端口 | 安全组放行 **80**、**443**（见下文） |

---

## 第 1 步：DNS 解析

在域名控制台添加 **A 记录**：

| 主机记录 | 类型 | 记录值 |
|----------|------|--------|
| `api` | A | `43.156.132.120` |

保存后等 5～30 分钟（有时更快）。

**验证 DNS（Mac 或 VPS）：**

```bash
dig +short api.你的域名.com
# 或
nslookup api.你的域名.com
```

应返回 `43.156.132.120`。

---

## 第 2 步：腾讯云安全组

在 [腾讯云控制台](https://console.cloud.tencent.com/) → 云服务器 → 安全组 → 入站规则，添加：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 80 | 0.0.0.0/0 | HTTP（Caddy 验证证书 + 跳转 HTTPS） |
| TCP | 443 | 0.0.0.0/0 | HTTPS |

**可选（HTTPS 稳定后）：** 关闭公网 **3000**，只通过 443 访问 API。

---

## 第 3 步：VPS 配置 Caddy

SSH 登录 VPS：

```bash
cd /opt/hyphen-app
git pull   # 确保有最新 deploy/ 与 docker-compose
```

创建 Caddy 配置（把域名改成你的）：

```bash
cp deploy/Caddyfile.example deploy/Caddyfile
nano deploy/Caddyfile
```

内容示例：

```
api.hyphen.example.com {
	encode gzip
	reverse_proxy api:3000
}
```

启动 API + Caddy：

```bash
sudo docker compose -f docker-compose.prod.yml --profile https up -d --build
```

查看 Caddy 是否拿到证书：

```bash
sudo docker compose -f docker-compose.prod.yml logs caddy --tail 30
```

应看到类似 `certificate obtained successfully` 或 `serving initial configuration`。

---

## 第 4 步：测试 HTTPS

```bash
curl https://api.你的域名.com/api/health
```

应返回：

```json
{"ok":true,"timestamp":...}
```

浏览器打开同一 URL 也应正常。

---

## 第 5 步：更新环境变量

### VPS `/opt/hyphen-app/.env`

若文件里有 API 地址相关变量，改为 HTTPS（多数情况下 API 容器本身不需要改，主要是 App 端）：

```env
# 如有设置可更新；App 用的是 EXPO_PUBLIC_* 
EXPO_PUBLIC_API_BASE_URL=https://api.你的域名.com
```

重启 API（可选）：

```bash
sudo docker compose -f docker-compose.prod.yml --profile https up -d --force-recreate api
```

### Mac 本机 `.env`

```env
EXPO_PUBLIC_API_BASE_URL=https://api.你的域名.com
```

**不要** 加末尾斜杠 `/`。

改完后 **清 cache 重启 Expo**：

```bash
cd /Users/kirafilm/Desktop/Hyphen-app
npx expo start -c
```

若用 **Dev Client**，改 env 后有时需重新 `eas build` 或至少完全重启 App。

---

## 第 6 步：App 行为变化

`app.config.ts` 会在 `EXPO_PUBLIC_API_BASE_URL` 以 `https://` 开头时：

- **关闭** iOS `NSAllowsArbitraryLoads`（不再允许任意 HTTP）
- **关闭** Android `usesCleartextTraffic`

这是上架前的正确配置。

---

## 常用命令

```bash
cd /opt/hyphen-app

# 查看所有容器
sudo docker compose -f docker-compose.prod.yml --profile https ps

# Caddy 日志
sudo docker compose -f docker-compose.prod.yml logs caddy --tail 50

# 重载 Caddy 配置（改 Caddyfile 后）
sudo docker compose -f docker-compose.prod.yml --profile https restart caddy

# 仅 API + MySQL（不用 HTTPS profile）
sudo docker compose -f docker-compose.prod.yml up -d
```

---

## 故障排查

### 证书申请失败

1. DNS 是否已指向 VPS IP（`dig api.你的域名.com`）
2. 安全组 **80、443** 是否已放行
3. 域名是否拼写与 `deploy/Caddyfile` 完全一致
4. 查看日志：`logs caddy --tail 50`

### App 连不上新域名

1. Mac `.env` 是否已改并 `expo start -c`
2. 真机是否仍缓存旧 IP：完全关闭 App 再开
3. 本机测试：`curl https://api.你的域名.com/api/health`

### 仍想用 IP:3000 调试

HTTPS 上线后建议关闭公网 3000。临时调试可在 VPS 本机：

```bash
curl http://127.0.0.1:3000/api/health
```

---

## Supabase / 其他服务

Email 密码登录走 Supabase 云端，**一般不需要** 在 Supabase 里改 API 域名。

若之后加 OAuth 回调指向你的 API，再在 Supabase → Authentication → URL Configuration 添加新域名。
