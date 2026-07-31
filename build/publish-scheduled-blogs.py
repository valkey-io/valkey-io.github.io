#!/usr/bin/env python3
"""Release blog posts whose publish date has arrived.

Scans `content/blog` for posts marked `draft = true` in their TOML frontmatter.
When a post's `date` is now in the past, the `draft` line is removed so Zola
will render it on the next build.

Dates without a timezone are read as UTC. Frontmatter is parsed with `tomllib`
rather than pattern matching, so a `draft` key inside a table, in a comment, or
within a string value is never mistaken for the real one.

Only the `draft` line is removed; the rest of the file, including its line
endings, is left byte-for-byte intact. Writes the released paths to
$GITHUB_OUTPUT as `published`.
"""

import datetime
import os
import pathlib
import sys
import tomllib

UTC = datetime.timezone.utc
FENCE = "+++"


def split_frontmatter(text):
    """Return (start, end) offsets of the TOML between the leading `+++` fences.

    Returns None when the file does not open with a frontmatter block.
    """
    body = text.lstrip()
    if not body.startswith(FENCE):
        return None

    start = text.index(FENCE) + len(FENCE)
    end = text.find(FENCE, start)
    if end == -1:
        return None
    return start, end


def as_utc(value):
    """Coerce a parsed TOML `date` into an aware datetime, or None if unusable.

    `tomllib` yields a date, a datetime, or a string when the value was quoted.
    Quoted values are re-parsed as bare TOML so the same rules apply to both.
    """
    if isinstance(value, str):
        try:
            value = tomllib.loads(f"date = {value.strip()}")["date"]
        except tomllib.TOMLDecodeError:
            return None

    if isinstance(value, datetime.datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, datetime.date):
        return datetime.datetime(value.year, value.month, value.day, tzinfo=UTC)
    return None


def strip_draft(frontmatter, data):
    """Remove the `draft` line from `frontmatter`, or None if it can't be found.

    Rather than trying to recognize the line by eye, each candidate is removed
    and the result re-parsed: the edit is accepted only if it drops `draft` and
    changes nothing else. That rules out a `draft = true` sitting inside a
    multi-line string, where deleting the line would corrupt the value.

    Line endings are preserved so a CRLF-authored post yields a one-line diff.
    """
    expected = {key: value for key, value in data.items() if key != "draft"}
    lines = frontmatter.splitlines(keepends=True)

    for index, line in enumerate(lines):
        if "draft" not in line:
            continue
        candidate = "".join(lines[:index] + lines[index + 1 :])
        try:
            if tomllib.loads(candidate.strip("\r")) == expected:
                return candidate
        except tomllib.TOMLDecodeError:
            continue  # removing this line broke the TOML, so it wasn't the one
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
            # A CRLF file leaves a lone trailing `\r` that tomllib rejects.
            data = tomllib.loads(text[start:end].strip("\r"))
        except tomllib.TOMLDecodeError as error:
            sys.exit(f"{path}: invalid TOML frontmatter: {error}")

        if data.get("draft") is not True:
            continue

        if "date" not in data:
            sys.exit(f"{path}: draft has no `date`, so it can never publish")

        publish_at = as_utc(data["date"])
        if publish_at is None:
            sys.exit(f"{path}: unrecognized `date` value {data['date']!r}")
        if publish_at > now:
            print(f"holding {path} until {publish_at:%Y-%m-%d %H:%M %Z}")
            continue

        stripped = strip_draft(text[start:end], data)
        if stripped is None:
            sys.exit(f"{path}: could not remove the `draft` line")

        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(text[:start] + stripped + text[end:])
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
