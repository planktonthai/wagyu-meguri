#!/usr/bin/env python3
"""從 data/japan-wagyu-brands.json 產生中性的品牌試算表（不含任何人的吃過紀錄）。

用法：python3 tools/make_xlsx.py   （需要 openpyxl）
"""
import json, os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = json.load(open(os.path.join(ROOT, "data", "japan-wagyu-brands.json"), encoding="utf-8"))
PN = {int(k): v for k, v in DATA["prefNames"].items()}
REGION = {}
for name, ids in [("北海道", [1]), ("東北", range(2, 8)), ("關東", range(8, 15)), ("中部", range(15, 24)),
                  ("近畿", range(24, 31)), ("中國・四國", range(31, 40)), ("九州・沖繩", range(40, 48))]:
    for i in ids: REGION[i] = name

F = "Arial"
HDR_FILL, HDR_FONT = PatternFill("solid", fgColor="4F6642"), Font(name=F, bold=True, color="FFFFFF")
INPUT_FILL = PatternFill("solid", fgColor="FFF4C2")
BODY, THIN = Font(name=F, size=11), Side(style="thin", color="D3D9C9")

wb = Workbook()
ws = wb.active; ws.title = "全日本品牌牛"
ws.append(["編號", "地區", "都道府縣", "品牌名（日文）", "品種", "備註", "吃過（填 ✓）", "我的備註"])
rows = [[REGION[r["p"]], PN[r["p"]], r["n"], r["t"] or "未標示", r.get("m") or ""] for r in DATA["rows"]]
rows += [["跨縣", w["w"], w["n"], w["t"] or "未標示", w.get("m") or ""] for w in DATA["wide"]]
for i, r in enumerate(rows, 1): ws.append([i] + r + ["", ""])
last = ws.max_row
for c in ws[1]: c.fill, c.font, c.alignment = HDR_FILL, HDR_FONT, Alignment(vertical="center")
for row in ws.iter_rows(min_row=2, max_row=last):
    for c in row: c.font, c.border = BODY, Border(bottom=THIN)
    row[6].fill = INPUT_FILL; row[6].alignment = Alignment(horizontal="center")
    row[7].fill = INPUT_FILL
for i, w in enumerate([7, 11, 12, 30, 12, 30, 13, 30], 1): ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = "A2"; ws.auto_filter.ref = f"A1:H{last}"

st = wb.create_sheet("各縣統計")
st.append(["地區", "都道府縣", "收錄品牌數", "已吃數", "已吃比例"])
src = "'全日本品牌牛'"
for p in range(1, 48):
    r = st.max_row + 1
    st.append([REGION[p], PN[p], f"=COUNTIF({src}!$C$2:$C${last},B{r})",
               f"=COUNTIFS({src}!$C$2:$C${last},B{r},{src}!$G$2:$G${last},\"✓\")", f"=IF(C{r}=0,0,D{r}/C{r})"])
r = st.max_row + 1
st.append(["跨縣品牌", "—", f"=COUNTIF({src}!$B$2:$B${last},\"跨縣\")",
           f"=COUNTIFS({src}!$B$2:$B${last},\"跨縣\",{src}!$G$2:$G${last},\"✓\")", f"=IF(C{r}=0,0,D{r}/C{r})"])
end = st.max_row; tr = end + 1
st.append(["合計", "", f"=SUM(C2:C{end})", f"=SUM(D2:D{end})", f"=IF(C{tr}=0,0,D{tr}/C{tr})"])
for c in st[1]: c.fill, c.font = HDR_FILL, HDR_FONT
for row in st.iter_rows(min_row=2, max_row=tr):
    for c in row: c.font, c.border = BODY, Border(bottom=THIN)
    row[3].number_format = "0;-0;-"; row[4].number_format = "0%;-0%;-"
for c in st[tr]: c.font = Font(name=F, bold=True)
for i, w in enumerate([12, 12, 12, 10, 10], 1): st.column_dimensions[get_column_letter(i)].width = w
st.freeze_panes = "A2"

info = wb.create_sheet("說明")
for a, b in [("怎麼用", ""), ("吃過", "在「全日本品牌牛」的 G 欄填 ✓，「各縣統計」會自動算出已吃數與比例。黃底格是可以填的欄位。"),
             ("品種", "只在來源寫明，或品牌本身定義品種時標示；其餘為「未標示」。"), ("", ""),
             ("網站", "https://planktonthai.github.io/wagyu-meguri/"),
             ("資料來源", "Wikipedia「日本のブランド牛一覧」、brand-meat.com、penguin-toyu.net，詳見網站 README。")]:
    info.append([a, b])
for row in info.iter_rows():
    for c in row: c.font = Font(name=F, bold=(c.column == 1)); c.alignment = Alignment(wrap_text=True, vertical="top")
info.column_dimensions["A"].width = 12; info.column_dimensions["B"].width = 90

out = os.path.join(ROOT, "data", "日本和牛品牌清單.xlsx")
wb.save(out); print(out, last - 1, "筆")
