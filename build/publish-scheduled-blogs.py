#!/usr/bin/env python3
"""Release blog posts whose publish date has arrived.

Scans `content/blog` for posts marked `draft = true` in their TOML frontmatter.
When a post's `date` is now in the past, the `draft` key is removed so Zola will
render it on the next build.

Dates without a timezone are read as UTC. Frontmatter is edited with `tomlkit`,
which preserves the original formatting, comments, and line endings, so only the
`draft` line changes.

Writes the released paths to $GITHUB_OUTPUT as `published`.
"""

import datetime
import os
import pathlib
import sys

import tomlkit

UTC = datetime.timezone.utc
FENCE = "+++"


def split_frontmatter(text):
    """Return (start, end) offsets of the TOML between the leading `+++` fences.

    Returns None when the file does not open with a frontmatter block.
    """
    if not text.lstrip().startswith(FENCE):
        return None

    start = text.index(FENCE) + len(FENCE)
    end = text.find(FENCE, start)
    if end == -1:
        return None
    return start, end


def as_utc(value):
    """Coerce a parsed TOML `date` into an aware datetime, or None if unusable.

    TOML dates arrive as a date or datetime. A quoted value arrives as a string,
    so it is re-parsed as bare TOML to hold both forms to the same rules.
    """
    if isinstance(value, str):
        try:
            value = tomlkit.parse(f"date = {value.strip()}")["date"]
        except Exception:
            return None

    if isinstance(value, datetime.datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, datetime.date):
        return datetime.datetime(value.year, value.month, value.day, tzinfo=UTC)
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

        bounds = split_frontmatter(text)
        if bounds is None:
            continue
        start, end = bounds

        # Invalid TOML already fails `zola build`, so treat it as an error here
        # rather than skipping the file and publishing nothing.
        try:
            # A CRLF file leaves a lone trailing `\r` that the parser rejects.
            # Only strip the trailing one: a leading `\r` is half of the CRLF
            # that ends the opening fence line and must be kept.
            frontmatter = tomlkit.parse(text[start:end].rstrip("\r"))
        except Exception as error:
            sys.exit(f"{path}: invalid TOML frontmatter: {error}")

        # Reading the key directly only ever sees the top-level table, so a
        # `draft` inside [extra], a comment, or a string is never confused
        # for the real one.
        if frontmatter.get("draft") is not True:
            continue

        if "date" not in frontmatter:
            sys.exit(f"{path}: draft has no `date`, so it can never publish")

        publish_at = as_utc(frontmatter["date"])
        if publish_at is None:
            sys.exit(f"{path}: unrecognized `date` value {frontmatter['date']!r}")
        if publish_at > now:
            print(f"holding {path} until {publish_at:%Y-%m-%d %H:%M %Z}")
            continue

        del frontmatter["draft"]
        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(text[:start] + tomlkit.dumps(frontmatter) + text[end:])
        print(f"releasing {path} (dated {publish_at:%Y-%m-%d %H:%M %Z})")
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
