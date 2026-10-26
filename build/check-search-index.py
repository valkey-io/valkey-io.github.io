#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.9"
# ///
"""Check the site's Pagefind search index.

Usage: build/check-search-index.py [public-dir]

Fails on:
- missing: a rendered page is not in the index.
- unexpected: the index has a page that isn't rendered, such as the 404 page.
- title mismatch: a page's search title isn't the name in its <title>.
- duplicate title: two indexed pages have the same <title>.
"""

import collections
import gzip
import html
import json
import pathlib
import re
import sys

FRAGMENT_PREFIX = b"pagefind_dcd"


def expected_pages(public):
    """Return {URL: <title> text}, skipping redirect stubs, the 404 page and HTML
    fragments that aren't full pages."""
    pages = {}
    for path in public.rglob("*.html"):
        source = path.read_text(encoding="utf-8", errors="replace")
        is_redirect = '<meta http-equiv="refresh"' in source
        is_fragment = "<html" not in source
        if is_redirect or is_fragment or path.name == "404.html":
            continue
        url = "/" + path.relative_to(public).as_posix()
        title = re.search(r"<title>(.*?)</title>", source, re.DOTALL)
        pages[url.removesuffix("index.html")] = normalise(html.unescape(title.group(1))) if title else ""
    return pages


def normalise(text):
    return " ".join(text.split())


def indexed_records(public):
    """Return every page record in the index.

    The fragment format is undocumented, so a Pagefind upgrade that changes it
    should fail here rather than check nothing.
    """
    records = []
    for path in (public / "pagefind" / "fragment").glob("*.pf_fragment"):
        data = gzip.decompress(path.read_bytes())
        records.append(json.loads(data.removeprefix(FRAGMENT_PREFIX)))
    return records


def matches_page_title(record, page_title):
    # <title> is the search title on its own or after a prefix.
    title = normalise(record["meta"].get("title", ""))
    return page_title == title or page_title.endswith(" · " + title)


def main():
    public = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "public")
    expected = expected_pages(public)
    records = indexed_records(public)
    if not records:
        print(f"error: no search index records under {public / 'pagefind'}")
        return 1

    indexed = {record["url"] for record in records}
    indexed_titles = {url: title for url, title in expected.items() if url in indexed}
    title_counts = collections.Counter(indexed_titles.values())
    failures = {
        "missing": expected.keys() - indexed,
        "unexpected": indexed - expected.keys(),
        "title mismatch": {r["url"] for r in records if not matches_page_title(r, expected.get(r["url"], ""))},
        "duplicate title": {f'{url} ("{title}")' for url, title in indexed_titles.items() if title_counts[title] > 1},
    }

    counts = ", ".join(f"{len(urls)} {name}" for name, urls in failures.items())
    print(f"{len(records)} pages indexed, {len(expected)} expected: {counts}")
    for name, urls in failures.items():
        for url in sorted(urls):
            print(f"{name}: {url}")
    return 1 if any(failures.values()) else 0


if __name__ == "__main__":
    sys.exit(main())
