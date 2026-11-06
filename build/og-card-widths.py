#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.9"
# dependencies = ["pillow==11.3.0"]
# ///
"""Regenerate the og card's width table.

    ./build/og-card-widths.py

Rewrites `_data/og-card/open-sans-400.json`: the advance widths, in em, of the site's Open
Sans 400, which the card's template adds up to set its lines. Rerun it when the font files
change.

The site build never runs this. Without uv, install Pillow and run it with `python3`.
"""

import json
import pathlib
import sys

from PIL import ImageFont

SITE = pathlib.Path(__file__).resolve().parent.parent
FONT = SITE / "static/fonts/open-sans/opensans-latin-normal-400-v20.woff2"
WIDTHS = SITE / "_data/og-card/open-sans-400.json"

# Printable ASCII and the punctuation and accents titles use. The template counts any other
# character as 1em, the width of a CJK character.
GLYPHS = [chr(c) for c in range(32, 127)] + list("’‘“”–—…×éèüöäñç")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        sys.exit(__doc__)
    font = ImageFont.truetype(str(FONT), 1000, layout_engine=ImageFont.Layout.BASIC)
    table = {c: int(font.getlength(c) + 0.5) / 1000 for c in sorted(GLYPHS)}
    WIDTHS.write_text(json.dumps(table, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
