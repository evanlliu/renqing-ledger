# 人情记账本 / Gift Ledger v1.1.3

一个用于记录收人情、封人情、节日人情、过年红包的人情往来系统。

技术栈：

- HTML + jQuery
- GitHub Pages 部署前端
- Cloudflare Worker 读写 GitHub `data.json`
- `data.json` 保存数据、设置、Cloudflare 自定义同步地址和访问密码
- 支持 PC 和移动端，重点兼容 iOS Safari 添加到主屏幕
- 支持中文 / English


## v1.1.3 更新内容

### 本次修复

1. 修复保存设置时 `cloudConfig` 旧值可能覆盖新输入 Cloudflare 地址 / 访问密码的问题。
2. 保存设置时现在会把 Cloudflare Worker 地址和访问密码同时强制写入：
   - `settings.cloud.cloudflareWorkerUrl`
   - `settings.cloud.accessPassword`
   - `cloudConfig.cloudflareWorkerUrl`
   - `cloudConfig.accessPassword`
3. 新增保存后验证：页面会重新通过 Worker 读取远端 `data.json`，确认云配置确实已经写入。
4. 如果 Worker 返回成功，但远端 `data.json` 没有验证到配置，页面会提示检查 `GH_REPO` / `DATA_PATH` 是否指向当前仓库。
5. 启动时优先使用 `data.json` 中的云配置，只有 `data.json` 没有配置时，才用本设备缓存作为兜底。
6. 保留可选 URL 引导参数：`?worker=你的Worker地址&password=你的访问密码`，用于极端情况下快速给新设备写入配置。

### 重要说明

从 v1.1.3 开始，后续已经有线上数据时，不建议直接覆盖 GitHub 上的 `data.json`。

因为 `data.json` 里保存了：

- 人情记录数据
- 人员配置
- 关系 / 分组配置
- Cloudflare Worker 地址
- 访问密码

如果上传一个空白模板 `data.json`，新设备和 iOS 主屏幕应用就无法从 `data.json` 读取 Cloudflare 配置。

推荐更新方式：

- 已经部署过：只更新 `index.html` 和 `README.md`
- 第一次部署：才上传模板 `data.json`
- Cloudflare Worker：本版本不需要更新 `worker.js`

## v1.1.1 更新内容

### 本次修复

1. 修复更换设备后，Cloudflare Worker 地址和访问密码需要重新配置的问题。
2. 页面第一次加载 `data.json` 后，会优先从 `data.json` 的 `settings.cloud` 和 `cloudConfig` 读取同步配置，并自动填充到设置页面。
3. 新增 `cloudConfig` 镜像字段，保存设置时会同时写入 `settings.cloud` 和 `cloudConfig`，提升多设备同步兼容性。
4. 云端返回的 `data.json` 如果同步配置为空，不会再覆盖本设备已有的 Cloudflare 地址和访问密码。

## v1.1.0 更新内容

### 新增功能

1. CSV 导入 / 导出，可用 Excel 打开和编辑。
2. 按人查看历史记录。
3. 回收站恢复和彻底删除。
4. 汇率折算统计，可设置基准货币和各币种汇率。
5. 统计图表：按人、按类型、按年份、按货币统计。
6. 关系配置和分组配置。
7. 人员管理中的关系、分组只能从配置项下拉选择。

### 优化内容

1. 新增 / 编辑记录时，姓名只能从人员管理中选择。
2. 新增 / 编辑记录时，事件类型只能从类型管理中选择。
3. 选择姓名后，关系和分组自动带出，并且不可编辑。
4. 旧数据如果存在手动输入姓名，会自动迁移为人员数据。
5. 移动端禁止页面左右晃动。
6. 优化 iOS Safari 日期输入宽度，避免日期框过长。
7. 保留第一次加载时重新读取 `data.json` 的逻辑。
8. 保留 Cloudflare 自定义配置地址和访问密码写入 `data.json` 的逻辑，方便多设备同步。

## 文件说明

GitHub 首次部署需要上传：

- `index.html`
- `data.json`
- `README.md`

已经有线上数据后，普通版本更新建议只上传：

- `index.html`
- `README.md`

不要直接覆盖线上 `data.json`，除非你确认要重置所有数据和云配置。

Cloudflare Worker：

- `worker.js`

本版本的核心修复在 `index.html`。`worker.js` 与旧版本保持兼容，如果你已经部署过 v1.0.0 之后的 Worker，可以不更新 Cloudflare；如果是第一次部署，请粘贴本目录中的 `worker.js`。

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

注意：如果你的 GitHub 仓库是公开的，`data.json` 中保存的 Cloudflare 地址和访问密码可能被看到。建议仓库设置为 Private，或者不要使用重要密码。

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

## 部署顺序

1. 上传 `index.html`、`data.json`、`README.md` 到 GitHub。
2. 如果第一次部署，Cloudflare Worker 粘贴 `worker.js`。
3. 在 Cloudflare 配置 Variables and Secrets。
4. 打开页面，进入 `设置`。
5. 填写 Cloudflare Worker 地址和访问密码。
6. 保存后页面会提示“云配置已写入 data.json，并验证成功”。
7. 其他设备或 iOS 主屏幕打开时，会直接从 `data.json` 读取并自动填充。
