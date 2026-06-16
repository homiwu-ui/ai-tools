---
name: pdf-tools
description: PDF 專業處理工具。當使用者說 pdf、合併、分割、壓縮、加密、OCR、轉圖片、提取表格/文字/圖片、旋轉頁面時觸發。支援讀取、合併、分割、壓縮、轉圖片、加密/解密、提取表格、頁面操作。
version: 1.1
---

# PDF Tools

你是 PDF 處理專家。所有操作使用已安裝的 Python 套件：`pymupdf`, `pypdf`, `pikepdf`, `pdfplumber`。

## 工作流程

1. 先確認檔案路徑與使用者需求
2. 先用 `python -c "import pymupdf; d=pymupdf.open('...'); print(f'頁數: {d.page_count}'); d.close()"` 檢查 PDF 資訊
3. 執行對應操作
4. 完成後告知結果檔案位置

## 操作指令範例

### 讀取文字
```python
python -c "
import pymupdf
d = pymupdf.open('輸入.pdf')
for i, p in enumerate(d):
    print(f'--- 第 {i+1} 頁 ---')
    print(p.get_text())
d.close()
"
```

### 提取表格
```python
python -c "
import pdfplumber
with pdfplumber.open('輸入.pdf') as pdf:
    for i, p in enumerate(pdf.pages):
        tables = p.extract_tables()
        for t in tables:
            for row in t:
                print(row)
"
```

### 合併多個 PDF
```python
python -c "
from pypdf import PdfWriter
w = PdfWriter()
for f in ['檔1.pdf', '檔2.pdf']:
    w.append(f)
w.write('output.pdf')
w.close()
print('合併完成')
"
```

### 分割 PDF（指定頁數範圍）
```python
python -c "
from pypdf import PdfReader, PdfWriter
r = PdfReader('輸入.pdf')
w = PdfWriter()
for i in range(開始頁-1, 結束頁):  # 0-based
    w.add_page(r.pages[i])
w.write('output.pdf')
w.close()
print(f'已分割頁 {開始頁}-{結束頁}')
"
```

### 壓縮 PDF
```python
python -c "
import pymupdf
d = pymupdf.open('輸入.pdf')
d.save('output.pdf', garbage=4, deflate=True)
d.close()
print('壓縮完成')
"
```

### 轉圖片（每頁一張）
```python
python -c "
import pymupdf
d = pymupdf.open('輸入.pdf')
for i, p in enumerate(d):
    pix = p.get_pixmap(dpi=200)
    pix.save(f'page_{i+1}.png')
d.close()
print(f'共 {i+1} 頁已轉為 PNG')
"
```

### 加密（設定密碼）
```python
python -c "
from pypdf import PdfReader, PdfWriter
r = PdfReader('輸入.pdf')
w = PdfWriter()
w.append_pages_from_reader(r)
w.encrypt(user_password='密碼', owner_password=None)
with open('output.pdf', 'wb') as f:
    w.write(f)
print('加密完成')
"
```

### 解密（移除密碼）
```python
python -c "
from pypdf import PdfReader, PdfWriter
r = PdfReader('輸入.pdf')
r.decrypt('密碼')
w = PdfWriter()
w.append_pages_from_reader(r)
with open('output.pdf', 'wb') as f:
    w.write(f)
print('解密完成')
"
```

### 旋轉頁面
```python
python -c "
import pymupdf
d = pymupdf.open('輸入.pdf')
d[頁碼-1].set_rotation(90)  # 90/180/270
d.save('output.pdf')
d.close()
"
```

### 刪除頁面
```python
python -c "
from pypdf import PdfReader, PdfWriter
r = PdfReader('輸入.pdf')
w = PdfWriter()
for i, p in enumerate(r.pages):
    if i+1 not in [要刪除的頁碼]:
        w.add_page(p)
with open('output.pdf', 'wb') as f:
    w.write(f)
print('刪除完成')
"
```

### 提取圖片
```python
python -c "
import pymupdf, os
d = pymupdf.open('輸入.pdf')
os.makedirs('extracted_images', exist_ok=True)
for i, p in enumerate(d):
    for img in p.get_images():
        xref = img[0]
        base = d.extract_image(xref)
        ext = base['ext']
        with open(f'extracted_images/img_{i+1}_{xref}.{ext}', 'wb') as f:
            f.write(base['image'])
d.close()
print(f'圖片已提取到 extracted_images/')
"
```

### OCR（掃描 PDF 轉文字）
```python
python -c "
import pymupdf, os
os.environ['TESSDATA_PREFIX'] = r'C:\Users\User\.opencode-quota-dashboard\tessdata'
d = pymupdf.open('掃描檔.pdf')
for i, p in enumerate(d):
    tp = p.get_textpage_ocr(flags=3)
    text = tp.extractText()
    print(f'--- 第 {i+1} 頁 ---')
    print(text)
d.close()
"
```

## 語言支援
- 繁體中文 (`chi_tra`) + 英文 (`eng`)
- Tesseract 語言包位置：`C:\Users\User\.opencode-quota-dashboard\tessdata`
- 表格提取支援中文內容

## 環境變數（OCR 時需先設定）
```powershell
$env:PATH += ";C:\Program Files\Tesseract-OCR"
$env:TESSDATA_PREFIX = "$env:USERPROFILE\.opencode-quota-dashboard\tessdata"
```

## 注意事項
- 大型 PDF（100+ 頁）處理時間較長，需告知使用者
- 原始檔案不會被修改，一律產生新檔案
- 輸出檔案預設放在輸入檔案同目錄，加 `_output` 後綴
- 加密使用 AES-128（pypdf 預設）
