# 部署指南

## 自动化部署流程

r2cloud 支持完全自动化部署，包括 R2 存储桶和 KV 命名空间的自动创建。

### 前置要求

1. **Cloudflare 账户**
   - 有效的 Cloudflare 账户
   - 已创建 Workers 应用
   - 具有 R2 权限

2. **本地环境**
   ```bash
   # 安装 Wrangler CLI
   npm install -g wrangler

   # 认证
   wrangler login
   ```

3. **Node.js 18+**

### 部署步骤

#### 1. Fork 并克隆仓库

```bash
git clone https://github.com/your-username/r2cloud.git
cd r2cloud
npm install
```

#### 2. 自动部署（推荐）

```bash
# 一键部署：自动创建 R2 桶 + KV 命名空间 + 构建资源
npm run build

# 然后部署到 Cloudflare
wrangler deploy
```

**部署流程说明**：
- ✅ `npm run build` 执行 predeploy.mjs
  - 创建 R2 存储桶（如果不存在）
  - 创建 KV 命名空间（生产 + 预览）
  - 更新 wrangler.toml 配置文件
  - 准备资源文件到 .cf-assets/
  
- ✅ `wrangler deploy` 部署 Worker
  - 使用自动创建的 KV ID
  - 部署到 Cloudflare Workers

#### 3. 本地开发

```bash
npm run dev
```

自动创建本地开发 KV 命名空间和 R2 桶。

### 自动创建的资源

部署后自动创建：

| 资源 | 名称 | 类型 | 说明 |
|-----|------|------|------|
| R2 存储桶 | `r2cloud` | R2 Bucket | 主存储桶 |
| KV 生产 | `r2cloud-cache` | KV Namespace | 生产环境缓存 |
| KV 预览 | `r2cloud-cache-preview` | KV Namespace | 预览环境缓存 |

### 配置文件

#### wrangler.toml

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "r2cloud"

[[kv_namespaces]]
binding = "CACHE"
id = "自动填充"
preview_id = "自动填充"
```

#### .kv-namespaces.json（自动生成）

首次部署后生成，记录 KV 命名空间 ID：

```json
{
  "prodId": "xxxxxxxxxxxxxxxxxxxxxxxx",
  "previewId": "yyyyyyyyyyyyyyyyyyyyyyyy",
  "timestamp": "2026-03-19T10:00:00.000Z"
}
```

此文件应被添加到 `.gitignore`，不提交到版本控制。

### 环境变量配置

#### wrangler.toml 中的权限配置

```toml
[vars]
GUEST = "public/"
"admin:666" = "*"
```

修改权限配置：

```toml
[vars]
# 游客可访问的目录（逗号分隔）
GUEST = "public/,downloads/"

# 用户账户格式：username:password = 权限范围
"user1:pass1" = "*"  # 完全权限
"user2:pass2" = "docs/,files/"  # 限制目录
```

### 常见问题

#### Q: 部署失败，提示 KV 创建错误？
**A**: 
- 检查是否已 `wrangler login`
- 确认 Cloudflare 账户有 KV 权限
- 手动删除重复的命名空间后重试

#### Q: 如何修改已创建的 KV 配置？
**A**: 删除 `.kv-namespaces.json` 文件，重新运行 `npm run build` 会重新创建

#### Q: 预开发环境无法连接 KV？
**A**: 确保运行 `npm run dev` 而不是直接运行 `wrangler dev`

#### Q: 如何在多个环境中使用不同的 R2 桶？
**A**: 在 wrangler.toml 中配置多个环境：

```toml
[env.staging]
[[env.staging.r2_buckets]]
binding = "BUCKET"
bucket_name = "r2cloud-staging"
```

### 手动部署（高级）

如果需要手动控制：

```bash
# 1. 创建 R2 桶
wrangler r2 bucket create r2cloud

# 2. 创建 KV 命名空间
wrangler kv:namespace create "r2cloud-cache"
wrangler kv:namespace create "r2cloud-cache-preview" --preview

# 3. 在 wrangler.toml 中手动填入 ID

# 4. 构建和部署
npm run build
wrangler deploy
```

### 监控和日志

```bash
# 查看实时日志
wrangler tail

# 查看部署历史
wrangler deployments list
```

### 回滚

```bash
# 回滚到上一个版本
wrangler rollback
```

---

**需要帮助？** 查看 [GitHub Issues](https://github.com/longern/r2cloud/issues)
