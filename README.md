# 人情记账本 / Gift Ledger v1.1.4

一个用于记录收人情、封人情、节日人情、过年红包的人情往来系统。

技术栈：

- HTML + jQuery
- GitHub Pages 部署前端
- Cloudflare Worker 读写 GitHub 仓库中已经存在的 `data.json`
- `data.json` 保存数据、设置、Cloudflare 自定义同步地址和访问密码
- 支持 PC 和移动端，重点兼容 iOS Safari 添加到主屏幕
- 支持中文 / English

## v1.1.4 更新内容

### 本次重点修复：data.json 只更新，不新建

1. 重新检查并调整 `data.json` 更新逻辑。
2. Cloudflare Worker 现在会先读取 GitHub 中已经存在的 `data.json`。
3. Worker 获取到现有文件 `sha` 后，再用 GitHub Contents API 更新同一个文件。
4. 如果 GitHub 中不存在 `data.json`，Worker 会直接报错，不会再自动创建一个新的 `data.json`。
5. 如果 `GH_REPO`、`GH_BRANCH`、`DATA_PATH` 配错，页面会收到明确错误，避免误以为保存成功。
6. 更新成功后 Worker 会返回：`repo`、`branch`、`path`、`oldSha`、`newSha`，方便确认到底更新了哪个仓库、哪个文件。
7. 前端保存时会记录远端 `sha`，后续同步会继续按“更新已有文件”的方式写入。
8. 保留保存设置后的远端验证逻辑，确认 `settings.cloud` / `cloudConfig` 确实写入远端 `data.json`。

### 正确的数据更新逻辑

页面打开或刷新时：

1. 先读取 GitHub Pages 同目录下的 `./data.json`。
2. 如果 `data.json` 里有 Cloudflare Worker 地址和访问密码，就继续调用 Worker。
3. Worker 从 GitHub 仓库读取最新的 `data.json`，并返回文件 `sha`。
4. 页面使用 Worker 返回的云端数据覆盖本地数据。
5. 之后新增、编辑、删除、配置修改，都会通过 Worker 更新 GitHub 中同一个 `data.json`。
6. Worker 不再负责新建 `data.json`。第一次部署时，你手动把模板 `data.json` 上传到 GitHub。

## 文件说明

GitHub 首次部署需要上传：

- `index.html`
- `data.json`
- `README.md`

已经有线上数据后，普通版本更新建议只上传：

- `index.html`
- `README.md`

不要直接覆盖线上 `data.json`，除非你确认要重置所有数据和云配置。

Cloudflare Worker 本版本需要更新：

- `worker.js`

因为 v1.1.4 的核心修复包含 Worker 的“只更新已有 data.json，不自动新建”逻辑。

## Cloudflare Variables and Secrets

Worker 需要配置：

| Name | Type | Example |
|---|---|---|
| APP_PASSWORD | Secret | 自定义访问密码 |
| GH_TOKEN | Secret | GitHub Token |
| GH_OWNER | Plaintext | GitHub 用户名 |
| GH_REPO | Plaintext | 仓库名 |
| GH_BRANCH | Plaintext | main |
| DATA_PATH | Plaintext | data.json |

注意：

- `GH_REPO` 必须是当前人情系统仓库，不要写成其他系统的仓库名。
- `DATA_PATH` 如果你的 `data.json` 在仓库根目录，就填 `data.json`。
- `GH_TOKEN` 需要有读取和写入仓库内容的权限，一般需要 `Contents: Read and write`。
- 如果你的 GitHub 仓库是公开的，`data.json` 中保存的 Cloudflare 地址和访问密码可能被看到。建议仓库设置为 Private，或者不要使用重要密码。

## 部署顺序

1. 第一次部署时，上传 `index.html`、`data.json`、`README.md` 到 GitHub。
2. Cloudflare Worker 粘贴 `worker.js`。
3. 在 Cloudflare 配置 Variables and Secrets。
4. 打开页面，进入 `设置`。
5. 填写 Cloudflare Worker 地址和访问密码。
6. 保存后页面会通过 Worker 更新 GitHub 中已有的 `data.json`。
7. 其他设备或 iOS 主屏幕打开时，会直接从 `data.json` 读取并自动填充。

## 如果保存后 GitHub data.json 没变化，按这个顺序检查

1. Cloudflare Worker 地址是否填对。
2. 页面访问密码是否等于 Worker 的 `APP_PASSWORD`。
3. `GH_REPO` 是否是人情系统仓库。
4. `GH_BRANCH` 是否是你 GitHub Pages 使用的分支，例如 `main`。
5. `DATA_PATH` 是否是 `data.json`，且仓库中已经存在这个文件。
6. `GH_TOKEN` 是否有当前仓库 Contents 读写权限。
7. GitHub Pages 可能有延迟，建议直接到 GitHub 仓库页面查看 `data.json` 文件内容是否更新。

## CSV 导入字段

CSV 第一行建议使用以下字段：

```csv
date,personName,relation,group,category,direction,eventType,amount,currency,returnAmount,note
```

示例：

```csv
2026-01-01,丹哥,朋友,中国,given,given,housewarming,320,CNY,120,房子过火
```

`category` 可选值：

- `received`
- `given`
- `holiday`
- `red_packet`

`direction` 可选值：

- `received`
- `given`

`eventType` 使用类型管理中的 `code`。

## 汇率说明

汇率用于统计折算，不会修改原始记录金额。

例如基准货币是 CNY：

```json
"exchangeRates": {
  "CNY": 1,
  "TRY": 0.22,
  "USD": 7.2
}
```

表示：

- 1 CNY = 1 CNY
- 1 TRY = 0.22 CNY
- 1 USD = 7.2 CNY
