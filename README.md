# r2cloud - Cloudflare R2 在线网盘

基于 Cloudflare R2 + Workers 的轻量级在线网盘系统。支持多用户权限管理、文件上传下载、安全的代理访问。

**特性**：
- ✅ **R2 存储** - 基于 Cloudflare R2 的对象存储
- ✅ **完全代理** - 所有文件访问通过 Workers 代理（无直链盗刷风险）
- ✅ **权限管理** - 多用户、多管理员、目录级权限控制
- ✅ **一键部署** - 自动创建 R2 桶、设置绑定和环境变量
- ✅ **无服务器** - 完全基于 Cloudflare，无需管理服务器

---

## 快速部署

### 前置要求
- Cloudflare 账户（免费版即可）
- GitHub 账户

### 部署步骤

#### 1. Fork 并连接 GitHub

1. Fork 本仓库到你的 GitHub 账户
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 前往 **Workers 和 Pages** → **创建应用程序** → **使用 Git 连接**
4. 选择 fork 的仓库，点击保存并部署

#### 2. 部署完成！✨

系统会自动：
- 创建名为 `r2cloud` 的 R2 存储桶
- 绑定 `BUCKET` 到该存储桶
- 配置默认环境变量：
  - `GUEST = "public/"` （游客访问权限）
  - `admin:666 = "*"` （管理员账户，密码是 666）

#### 3. 首次访问

访问部署的 Workers URL，用以下凭据登录：
- 用户名：`admin`
- 密码：`666`

---

## 使用说明

### 登录

选择登录方式：
1. **游客登录** - 访问 `public/` 目录（如果存在）
2. **账户登录** - 输入用户名和密码

### 用户权限管理

权限通过环境变量配置，格式为：

```
username:password=dir1/,dir2/,*
```

**示例**：
```
GUEST = "public/"
admin:666 = "*"
user1:password123 = "user1/,docs/"
user2:password456 = "project/"
```

**说明**：
- `*` 表示所有目录权限
- 多个目录用 `,` 分隔
- `GUEST` 是游客权限（不需要密码）
- 系统文件 `_$flaredrive$/` 只有写入权限用户可访问

### 修改管理员密码

要修改管理员密码，在 Cloudflare Dashboard 中：
1. 进入 Workers 项目设置
2. 找到变量 `admin:666`
3. 修改为 `admin:你的新密码`

### 文件操作

**在网盘中**：
- 上传：拖拽或点击上传按钮
- 下载：点击文件下载
- 删除：右键删除（需要写入权限）
- 创建文件夹：点击新建按钮

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发服务器
npm run dev

# 访问 http://localhost:8787
```

**注意**：本地开发需要配置 R2 预览桶。

---

## 项目结构

```
├── functions/              # Workers 处理函数
│   ├── _middleware.ts      # 请求路由
│   ├── api/
│   │   ├── buckets.ts      # 存储桶信息
│   │   ├── children/       # 文件列表 API
│   │   └── write/items/    # 上传/删除 API
│   └── raw/                # 原始文件读取
├── assets/                 # 前端资源
│   ├── App.vue            # 主应用
│   ├── main.mjs           # 工具函数
│   └── main.css           # 样式
├── utils/                  # 后端工具
│   ├── auth.ts            # 权限验证
│   ├── bucket.ts          # R2 操作
│   └── s3.ts              # S3 协议支持
├── scripts/
│   └── predeploy.mjs      # 部署前脚本（自动创建 R2）
└── wrangler.toml          # Workers 配置
```

---

## 安全建议

⚠️ **重要**：
1. **变更默认密码** - 首次部署后立即修改 `admin:666`
2. **R2 保持私有** - 确保 R2 bucket 未设置公开访问
3. **权限最小化** - 给用户分配必要的目录权限
4. **定期备份** - 重要文件定期导出备份

✅ **本项目优势**：
- 文件访问完全走 Workers 代理（无法直链盗刷）
- 权限控制在应用层实现（多层保护）
- R2 私有存储不暴露任何公开 URL

---

## 常见问题

**Q: 可以存储多大的文件？**  
A: R2 支持单个文件最大 5TB。网盘上传受浏览器限制（通常几 GB），可通过 API 上传更大文件。

**Q: 如何添加新用户？**  
A: 在 Workers 项目设置中添加新的环境变量，格式为 `username:password=dir/`。

**Q: 多个 Workers 共享一个 R2 桶吗？**  
A: 可以。修改 `wrangler.toml` 中的 `bucket_name` 指向已有的桶即可。

**Q: 支持公开分享文件吗？**  
A: 支持。将文件存储在 `public/` 目录，游客即可访问。

---

## 部署到 Cloudflare Pages

如果想用 Pages 部署：

1. 在 Cloudflare Dashboard 选择 **Pages**
2. 选择同一 GitHub 仓库
3. 配置与 Workers 相同的环境变量
4. 部署

Pages 会自动使用 `wrangler-pages.toml` 配置。

---

## 许可证

ISC

## 感谢

- [FlareDrive](https://github.com/longern/FlareDrive) - 原始项目灵感
- [Cloudflare](https://www.cloudflare.com) - 强大的基础设施支持

---

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [R2 文档](https://developers.cloudflare.com/r2/)
- [Workers 定价](https://workers.cloudflare.com/pricing/)
