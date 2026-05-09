# 人情记账本 / Gift Ledger v1.1.7

## v1.1.7 更新内容

- 新增“分类配置”。
- 新增记录中的“分类”不再写死，改为从 data.json 的 `categoryTypes` 读取。
- 更多菜单增加“分类配置”入口。
- 分类支持配置：Code、中文名称、英文名称、默认方向。
- 新增 / 编辑记录时，选择分类后会根据该分类的默认方向自动带出“收入 / 支出”。
- 旧数据自动兼容：原来的 `received / given / holiday / red_packet` 会自动迁移到 `categoryTypes`。
- 分类 Code 修改后，会同步更新已有记录和回收站记录里的分类 Code。

## 更新说明

已有线上数据时，不要覆盖 GitHub 上的 data.json。

GitHub 需要更新：

```text
index.html
README.md
```

Cloudflare 需要更新：

```text
不需要更新 worker.js
```

包里的 data.json 仅作为首次部署模板。
