# MarkItDown 自動轉換規則

當需要轉換檔案（.docx → .md、.pdf → .md、.xlsx → .md 等），自動用 `markitdown` CLI，不需詢問。

## 支援格式

| 來源 | 指令 |
|------|------|
| PDF / DOCX / PPTX / XLSX | `markitdown <檔案> -o <輸出.md>` |
| 圖片 / HTML / EPUB / CSV/JSON/XML | 同上 |
| YouTube 網址 | `markitdown "<url>" -o <輸出.md>` |

## 注意

- `.doc`（二進制）不支援 → 改用 olefile 或回報使用者
- 多檔批次用 PowerShell loop 處理
