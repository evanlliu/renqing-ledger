# 人情记账本 / Gift Ledger v1.1.6

## v1.1.6 更新内容

- 在记录列表增加“复制”按钮。
- PC 表格和移动端卡片都支持复制。
- 点击复制后，会打开新增记录窗口，并自动带出原记录的日期、姓名、关系、分类、方向、事件类型、金额、货币、回礼金额和备注。
- 保存后会作为一条新记录写入 data.json，不会覆盖原记录。

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
