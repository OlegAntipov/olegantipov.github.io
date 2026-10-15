#!/usr/bin/env python3
"""Shrinks games/cover-*.jpg in place (max 1280px wide, quality 80, progressive).
Originals are backed up to tools/_originals/. Needs: pip install pillow
Run from the project root:  python tools/optimize-covers.py
Do NOT upload the tools/ folder to your hosting."""
import shutil
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
backup = root / "tools" / "_originals"
backup.mkdir(parents=True, exist_ok=True)
saved = 0
for f in sorted((root / "games").glob("cover-*.jpg")):
    before = f.stat().st_size
    tmp = f.with_suffix(".tmp.jpg")
    im = Image.open(f).convert("RGB")
    im.thumbnail((1280, 1280), Image.LANCZOS)
    im.save(tmp, "JPEG", quality=80, optimize=True, progressive=True)
    if tmp.stat().st_size < before:
        shutil.copy2(f, backup / f.name)
        tmp.replace(f)
        saved += before - f.stat().st_size
        print(f"{f.name}: {before//1024} KB -> {f.stat().st_size//1024} KB")
    else:
        tmp.unlink()
        print(f"{f.name}: already small, skipped")
print(f"Saved {saved//1024} KB total")
