# 法律网页部署（隐私政策 / 使用条款）

App Store / Google Play 需要 **HTTPS 公开链接**，例如：

- `https://hyphenjob.com/privacy/`
- `https://hyphenjob.com/terms/`

内容与 App 内 `app/privacy.tsx`、`app/terms.tsx` 一致。

---

## 1. 本地生成 HTML（改 App 文案后重跑）

```bash
cd /Users/kirafilm/Desktop/Hyphen-app
node scripts/build-legal-web.mjs
```

产出：

- `deploy/web/index.html`
- `deploy/web/privacy/index.html`
- `deploy/web/terms/index.html`
- `deploy/web/assets/site.css`

---

## 2. VPS 部署静态文件

### Mac 打包上传

```bash
cd /Users/kirafilm/Desktop/Hyphen-app
node scripts/build-legal-web.mjs
tar czf hyphen-web.tgz -C deploy web
scp hyphen-web.tgz ubuntu@43.156.132.120:/tmp/
```

### VPS 解压

```bash
sudo mkdir -p /var/www/hyphen
sudo tar xzf /tmp/hyphen-web.tgz -C /var/www/hyphen
sudo chown -R www-data:www-data /var/www/hyphen/web 2>/dev/null || sudo chown -R ubuntu:ubuntu /var/www/hyphen/web
ls /var/www/hyphen/web/privacy/
```

---

## 3. Caddy 配置

编辑 `/opt/hyphen-app/deploy/Caddyfile`（在现有 `api.hyphenjob.com` 块**下面**增加）：

```caddyfile
hyphenjob.com, www.hyphenjob.com {
	encode gzip
	root * /var/www/hyphen/web
	file_server
	try_files {path} {path}/ /index.html
}
```

重载 Caddy（**必须**挂载静态目录，见 `docker-compose.prod.yml` 里 caddy 的 volume）：

```bash
cd /opt/hyphen-app
git pull   # 若已 push 含 volume 的 compose 更新
sudo docker compose -f docker-compose.prod.yml --profile https up -d --force-recreate caddy
```

确认容器内能读到文件：

```bash
sudo docker compose -f docker-compose.prod.yml exec caddy ls /var/www/hyphen/web/privacy/
```

---

## 4. DNS（若未设置）

| 主机记录 | 类型 | 值 |
|----------|------|-----|
| `@` | A | `43.156.132.120` |
| `www` | A | `43.156.132.120` |

Cloudflare 若开代理，确保 SSL 为 **Full** 或 **Full (strict)**。

---

## 5. 验证

```bash
curl -sI https://hyphenjob.com/privacy/ | head -5
```

浏览器打开：

- https://hyphenjob.com/privacy/
- https://hyphenjob.com/terms/

---

## 6. App Store / Play 填写

| 字段 | URL |
|------|-----|
| 隐私政策 | `https://hyphenjob.com/privacy/` |
| 支持 URL（可选） | `https://hyphenjob.com/` |

---

## 更新流程

1. 修改 `app/privacy.tsx` 或 `app/terms.tsx`
2. `node scripts/build-legal-web.mjs`
3. 重新 `scp` 到 VPS `/var/www/hyphen/web`
