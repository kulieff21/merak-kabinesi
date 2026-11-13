"""Fetch original OFL variable fonts for self-hosting. No runtime fetches."""
import hashlib
import json
import urllib.parse
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
target = root / "assets" / "fonts"
target.mkdir(parents=True, exist_ok=True)
metadata = []
for name, filename in [("Fraunces", "Fraunces[SOFT,WONK,opsz,wght].ttf"), ("Manrope", "Manrope[wght].ttf")]:
    font_url = "https://raw.githubusercontent.com/google/fonts/main/ofl/" + name.lower() + "/" + urllib.parse.quote(filename)
    font = urllib.request.urlopen(font_url, timeout=30).read()
    filename = f"{name.lower()}.ttf"
    (target / filename).write_bytes(font)
    license_url = f"https://raw.githubusercontent.com/google/fonts/main/ofl/{name.lower()}/OFL.txt"
    license_text = urllib.request.urlopen(license_url, timeout=30).read()
    (target / f"{name}-OFL.txt").write_bytes(license_text)
    metadata.append({"family": name, "file": filename, "source": font_url, "license": "SIL Open Font License 1.1", "license_source": license_url, "sha256": hashlib.sha256(font).hexdigest(), "bytes": len(font)})
(target / "provenance.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps([{k: row[k] for k in ("family", "file", "bytes", "sha256")} for row in metadata], indent=2))
