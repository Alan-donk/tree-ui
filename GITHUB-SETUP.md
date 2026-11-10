# GitHub 配置与发布指南（Windows）

本仓库已经在本地完成 `git init`、首次提交和 `v0.1.0` tag，**只差 GitHub 这一侧**。
下面按"先配认证 → 再建仓库 → 推送 → 开 Pages → 收尾"的顺序做一遍即可。

当前机器状态（已核对）：

| 项目 | 状态 |
| --- | --- |
| git | 2.45.1，可用 |
| 本地仓库 | 已有 1 个 commit + `v0.1.0` tag |
| GitHub CLI (`gh`) | 未安装 |
| git 凭据助手 | 未配置（`credential.helper` 为空） |
| GitHub SSH key | 没有（现有 key 都是 其他 的） |

---

## 1. 选一种认证方式（三选一）

### 方案 A：GitHub CLI（最省事，推荐）

```powershell
winget install --id GitHub.cli -e
# 新开一个终端让 PATH 生效
gh auth login          # 选 GitHub.com → HTTPS → Login with a web browser，复制 8 位 code 到浏览器
gh auth setup-git      # 让 gh 充当 git 的凭据助手，之后 push 不再输密码
gh auth status         # 应显示 ✓ Logged in to github.com
```

之后建仓 + 推送一条命令搞定（见第 3 节的 "gh 版"）。

> 没有 winget 时去 <https://cli.github.com/> 下 msi 安装包，效果一样。

### 方案 B：Personal Access Token + Git Credential Manager（不装额外工具）

1. 打开 <https://github.com/settings/tokens?type=beta> → **Generate new token**
   - Token name：`tree-ui-push`
   - Expiration：90 days（到期重新生成）
   - Repository access：先选 **All repositories**（仓库还没建），建完后可改成 Only select repositories
   - Permissions：**Contents = Read and write**（必需），**Metadata = Read**（自动带上），Actions 可选 Read and write
   - 生成后立刻复制，页面关掉就看不到了
2. 让 Git 用 Windows 凭据管理器保存 token：

```powershell
git config --global credential.helper manager
```

3. 第一次 `git push` 时弹窗：
   - 用户名填 GitHub 用户名
   - 密码处粘贴 **token**（不是账号密码）

> token 只存在 Windows 凭据管理器里，别写进仓库、别贴进 issue。
> 换账号或报"Authentication failed"时：控制面板 → 凭据管理器 → Windows 凭据 →
> 删除 `git:https://github.com` 后重试。

### 方案 C：SSH key（长期最稳，已有 ssh 目录适合你）

```powershell
ssh-keygen -t ed25519 -C "your-email@example.com" -f "$env:US其他ROFILE\.ssh\github_ed25519"
Get-Content "$env:US其他ROFILE\.ssh\github_ed25519.pub" | Set-Clipboard   # 复制公钥
```

1. 浏览器打开 <https://github.com/settings/keys> → **New SSH key** → 粘贴公钥
2. 在 `~/.ssh/config` 追加（避免和你现有 其他 key 冲突）：

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_ed25519
  IdentitiesOnly yes
```

3. 验证：

```powershell
ssh -T git@github.com
# Hi <你的用户名>! You've successfully authenticated...
```

SSH 方式的 remote 要用 `git@github.com:<owner>/tree-ui.git`（见第 3 节）。

---

## 2. 建仓库（Web UI）

打开 <https://github.com/new>：

- Repository name：`tree-ui`（和 `npm run set-repo` 里的名字保持一致）
- Visibility：**Public**（否则 Pages 需要付费计划）
- **不要**勾 Add README / Add .gitignore / Choose a license（本地已有，勾了会冲突）

---

## 3. 本地改名 + 推送

先把占位符换成你的真实账号（会改 `package.json`、`registry.json`、`src/demo/site.ts`、中英 README）：

```powershell
cd E:\GitHub插件
npm run set-repo -- <你的用户名>/tree-ui
npm run screenshot          # 可选：重新截图，让图中的安装命令变成真实 URL
git add -A
git commit --amend --no-edit   # 或 git commit -m "chore: point repo urls at github"
```

**HTTPS 方式（方案 A/B）：**

```powershell
git remote add origin https://github.com/<你的用户名>/tree-ui.git
git push -u origin main
git push origin v0.1.0
```

**用 gh 一次完成（方案 A）：**

```powershell
gh repo create tree-ui --public --source=. --remote=origin --push
git push origin v0.1.0
```

**SSH 方式（方案 C）：**

```powershell
git remote add origin git@github.com:<你的用户名>/tree-ui.git
git push -u origin main --tags
```

---

## 4. 打开 GitHub Pages

1. 仓库 → **Settings → Pages**
2. **Build and deployment → Source** 选 **GitHub Actions**
3. 仓库 → **Actions** → 等 `Deploy demo` 变绿（第一次约 1–2 分钟）
4. 访问 `https://<你的用户名>.github.io/tree-ui/`

验证 registry 是否可被 shadcn 安装：

```powershell
curl.exe -s https://<你的用户名>.github.io/tree-ui/r/tree.json
# 或浏览器打开上面这个地址，应看到 JSON
```

Demo 里的安装命令就是：

```bash
npx shadcn@latest add https://<你的用户名>.github.io/tree-ui/r/tree.json
```

> base path 由 workflow 自动取仓库名（`VITE_BASE=/${{ github.event.repository.name }}/`），
> 所以**仓库改名后要重新 push 触发部署**，否则白屏。

---

## 5. Actions 权限设置（确认一次即可）

- Settings → **Actions → General**
- Fork pull request workflows：按需
- **Workflow permissions**：`Read repository contents and packages permissions`（默认即可，
  deploy workflow 用的是仓库内置 `GITHUB_TOKEN`，不需要 PAT）
- 如果之前在 Pages 里手动选过 "Deploy from a branch"，记得切回 **GitHub Actions**，
  否则 `deploy-pages` 会报错

---

## 6. 仓库收尾（建议，2 分钟）

| 位置 | 填什么 |
| --- | --- |
| About → Description | `Accessible, zero-dependency tree view for shadcn/ui. Install with the shadcn CLI.` |
| About → Website | `https://<你的用户名>.github.io/tree-ui/` |
| About → Topics | `react` `shadcn` `tree-view` `tailwindcss` `accessibility` `component-library` `typescript` |
| Settings → General → Social preview | 上传 `docs/preview.png`（README 首图，社交分享卡片） |
| Releases → Draft a new release | 选 `v0.1.0`，标题 `v0.1.0`，正文复制 `CHANGELOG.md` 的 0.1.0 段 |

发布 Release 之后，仓库首页右上角会显示版本号，别人也更容易发现。

---

## 7. 常见故障

| 现象 | 原因 / 处理 |
| --- | --- |
| `Authentication failed` / 403 | PAT 过期或权限不够（需要 Contents: Read and write）；`gh auth status` 看状态；删掉 Windows 凭据里的 `git:https://github.com` 重试 |
| `Repository not found` | remote 的 owner/仓库名拼错，或仓库还没建；`git remote -v` 核对 |
| Pages 404 | `Deploy demo` 没成功；Settings → Pages 的 Source 不是 GitHub Actions；或者刚部署还在传播（等 1 分钟） |
| 页面白屏、资源 404 | base 与仓库名不一致：改过仓库名后要重新 push 触发部署 |
| `deploy-pages` 报 403 | Actions 权限被改成只读，或 Pages 仍是 branch 模式 |
| `r/tree.json` 404 | 构建产物没生成：本地 `npm run build` 后应有 `dist/r/tree.json`；workflow 里 `npm run build` 已包含注册表构建 |
| push 卡住不弹窗 | 开了 `credential.helper` 但凭据失效；`git config --global --get credential.helper` 检查 |

---

## 8. 之后每次发版

```powershell
npm run verify                    # 本地全量校验
npm version patch                 # 或 minor / major，自动打 tag
git push --follow-tags
```

CI 会跑 lint / typecheck / test / build / registry 校验，Deploy 会自动更新 Pages。
