#!/usr/bin/env python3
"""組裝 index.html 與 sw.js。

用法：python3 build.py
- 原始碼在 src/，資料在 data/
- 改完 src/ 或 data/ 後執行一次，再提交 index.html 和 sw.js
"""
import hashlib, json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
def read(*p): return open(os.path.join(ROOT, *p), encoding="utf-8").read()

def build():
    app = (read("src", "app.js")
        .replace("__PATHS__", read("data", "paths.json").strip())
        .replace("__CENTERS__", read("data", "centroids.json").strip())
        .replace("__ALL__", read("data", "japan-wagyu-brands.json").strip())
        .replace("__KB__", json.dumps(json.loads(read("data", "brand-notes.json")), ensure_ascii=False))
        .replace("__KBWIDE__", json.dumps(json.loads(read("data", "brand-notes-wide.json")), ensure_ascii=False)))
    for token in ("__PATHS__", "__CENTERS__", "__ALL__", "__KB__", "__KBWIDE__"):
        assert token not in app, token
    html = (read("src", "head.html") + read("src", "page-head.html") + "\n</head>\n<body>\n" + read("src", "body.html")
        + "\n<script>\n" + app + "\n</script>\n<script>\n" + read("src", "map3d.js") + "\n</script>\n<script>\n"
        + read("src", "loader.js") + "\n</script>\n<script>\n" + read("src", "sw-register.js") + "\n</script>\n</body>\n</html>\n")
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(html)
    version = hashlib.sha256(html.encode("utf-8")).hexdigest()[:10]
    open(os.path.join(ROOT, "sw.js"), "w", encoding="utf-8").write(read("src", "sw.js").replace("__VERSION__", version))
    print(f"index.html {len(html.encode('utf-8')) // 1024} KB，快取版本 {version}")

if __name__ == "__main__":
    build()
