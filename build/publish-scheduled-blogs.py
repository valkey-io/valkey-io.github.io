#!/usr/bin/env python3
"""Release blog posts whose publish date has arrived.

Scans `content/blog` for posts marked `draft = true` in their TOML frontmatter.
When a post's `date` is now in the past (UTC), the `draft` line is removed so
Zola will render it on the next build.

Only the `draft` line is touched; the rest of the file is left byte-for-byte
intact. Writes the list of released files to $GITHUB_OUTPUT as `published`.
"""

import datetime
import os
import pathlib
import re
import sys
import tomllib

UTC = datetime.timezone.utc
FRONTMATTER = re.compile(r"^\+\+\+[^\S\n]*\n(.*?)\n\+\+\+[^\S\n]*$", re.S | re.M)
DRAFT_LINE = re.compile(r"^\s*draft\s*=\s*true\s*(#.*)?$")


def as_utc(value, path):
    """Coerce a frontmatter `date` into an aware UTC datetime."""
    if isinstance(value, datetime.datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, datetime.date):
        return datetime.datetime(value.year, value.month, value.day, tzinfo=UTC)
    if isinstance(value, str):
        text = value.strip().replace("T", " ")
        text = re.split(r"[+]|\bZ$", text)[0].strip()
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
            try:
                return datetime.datetime.strptime(text, fmt).replace(tzinfo=UTC)
            except ValueError:
                continue
    print(f"::warning file={path}::unrecognized date {value!r}; leaving as draft")
    return None


def strip_draft(frontmatter):
    """Remove the top-level `draft` line, ignoring lines inside TOML tables.

    Keeps line endings intact so a CRLF-authored post yields a one-line diff.
    """
    lines = frontmatter.splitlines(keepends=True)
    for index, line in enumerate(lines):
        if line.lstrip().startswith("["):
            break  # a table header; `draft` past this point is not top-level
        if DRAFT_LINE.match(line):
            return "".join(lines[:index] + lines[index + 1 :])
    return None


def main():
    now = datetime.datetime.now(UTC)
    root = pathlib.Path("content/blog")
    if not root.is_dir():
        sys.exit(f"{root} not found; run from the repository root")

    released = []
    for path in sorted(root.rglob("*.md")):
        if path.name == "_index.md":
            continue

        # newline="" keeps CRLF intact instead of translating it to LF.
        with open(path, "r", encoding="utf-8", newline="") as handle:
            text = handle.read()
        match = FRONTMATTER.search(text)
        if not match or match.start() != 0:
            continue

        try:
            # A CRLF file leaves a lone trailing `\r` that tomllib rejects.
            data = tomllib.loads(match.group(1).rstrip("\r"))
        except tomllib.TOMLDecodeError as error:
            print(f"::warning file={path}::could not parse frontmatter: {error}")
            continue

        if data.get("draft") is not True:
            continue

        if "date" not in data:
            print(f"::warning file={path}::draft has no date; leaving as draft")
            continue

        publish_at = as_utc(data["date"], path)
        if publish_at is None:
            continue
        if publish_at > now:
            print(f"holding {path} until {publish_at:%Y-%m-%d %H:%M} UTC")
            continue

        stripped = strip_draft(match.group(1))
        if stripped is None:
            print(f"::warning file={path}::draft is set but no `draft` line found")
            continue

        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(text[: match.start(1)] + stripped + text[match.end(1) :])
        print(f"releasing {path} (dated {publish_at:%Y-%m-%d %H:%M} UTC)")
        released.append(str(path))

    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write(f"count={len(released)}\n")
            handle.write("published<<EOF\n")
            for item in released:
                handle.write(f"{item}\n")
            handle.write("EOF\n")

    print(f"released {len(released)} post(s)")


if __name__ == "__main__":
    main()
