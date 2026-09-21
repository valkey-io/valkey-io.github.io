#!/usr/bin/env python3
"""Report the state of the blog review queue as a Slack message.

Open pull requests that touch `content/blog` are bucketed by whose turn it is:
waiting on a copy editor (the `content-creators` team), waiting on a technical
reviewer (the `technical-blog-reviewers` team), or waiting on the author. The
report also lists drafts already on `main` that publish within the next week,
pull requests that are approved but unmerged, and blog pull requests missing the
`blog-post` label.

A review counts for a team only when its author belongs to that team, so the
token needs `read:org` on the organization that owns the repository.

Writes a Slack `chat.postMessage` payload to `--out`, without `channel` so the
caller supplies it, and a plain text version of the same report to stdout.
"""

import argparse
import datetime
import json
import os
import pathlib
import sys
import tomllib
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.github.com"
COPY_TEAM = "content-creators"
TECH_TEAM = "technical-blog-reviewers"
BLOG_LABEL = "blog-post"
BLOG_PATH = "content/blog/"
FENCE = "+++"
UTC = datetime.timezone.utc

# Slack rejects a section over 3000 characters, so long lists are split.
SECTION_LIMIT = 2900
TITLE_LIMIT = 90


def request(url, token):
    """Return (parsed body, Link header) for a GitHub API URL."""
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "valkey-blog-review-status",
        },
    )
    with urllib.request.urlopen(req) as response:
        return json.load(response), response.headers.get("Link", "")


def add_blog_label(repo, number, token):
    """Put the blog label on a pull request, returning whether it worked.

    Labelling needs write access. A token that lacks it should not cost the
    report, which is the job's real output, so the failure is reported instead.
    """
    try:
        request_json(
            f"{API}/repos/{repo}/issues/{number}/labels", token, {"labels": [BLOG_LABEL]}
        )
        print(f"labeled #{number} {BLOG_LABEL}")
        return True
    except urllib.error.HTTPError as error:
        print(f"could not label #{number}: {error.code} {error.reason}", file=sys.stderr)
        return False


def request_json(url, token, body):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "valkey-blog-review-status",
        },
    )
    with urllib.request.urlopen(req) as response:
        return json.load(response)


def next_link(link_header):
    """Return the `rel="next"` URL from a Link header, or None on the last page."""
    for part in link_header.split(","):
        section = part.split(";")
        if len(section) < 2:
            continue
        if 'rel="next"' in section[1]:
            return section[0].strip().strip("<>")
    return None


def get_all(url, token):
    """Return every item across a paginated collection endpoint."""
    items = []
    while url:
        page, link = request(url, token)
        items.extend(page)
        url = next_link(link)
    return items


def team_members(org, slug, token):
    """Return the logins on a team, or None when the token cannot read it."""
    url = f"{API}/orgs/{org}/teams/{slug}/members?per_page=100"
    try:
        return {member["login"] for member in get_all(url, token)}
    except urllib.error.HTTPError as error:
        if error.code in (403, 404):
            return None
        raise


def head_pushed_at(repo, pull, token):
    """Return when the pull request's head commit was created.

    Used to tell a review that is still the latest word from one the author has
    already answered with a push. Falls back to the pull request's own
    `updated_at`, which moves on a push as well but also moves on a comment.
    """
    sha = pull["head"]["sha"]
    try:
        commit, _ = request(f"{API}/repos/{repo}/commits/{sha}", token)
        return parse_time(commit["commit"]["committer"]["date"])
    except urllib.error.HTTPError as error:
        if error.code != 404:
            raise
        # The head repository can be deleted while the pull request stays open.
        return parse_time(pull["updated_at"])


def parse_time(value):
    return datetime.datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)


def team_turn(reviews, members, pushed_at):
    """Return whose turn it is for one team: approved, unreviewed, stale, author.

    `stale` means the team has reviewed but the author has pushed since, so the
    post is back in the queue. `author` means the team's review is the most
    recent word and the author owes a response.
    """
    latest = {}
    for review in reviews:
        login = (review.get("user") or {}).get("login")
        if login not in members or review["state"] == "PENDING":
            continue
        # Reviews come back oldest first, so the last write per user wins.
        latest[login] = review

    if not latest:
        return "unreviewed"
    if any(review["state"] == "APPROVED" for review in latest.values()):
        return "approved"

    newest = max(parse_time(review["submitted_at"]) for review in latest.values())
    if pushed_at > newest:
        return "stale"
    return "author"


def frontmatter(text):
    """Return the parsed TOML frontmatter of a post, or None if it has none."""
    if not text.lstrip().startswith(FENCE):
        return None
    start = text.index(FENCE) + len(FENCE)
    end = text.find(FENCE, start)
    if end == -1:
        return None
    try:
        # A CRLF file leaves a lone trailing `\r` that the parser rejects.
        return tomllib.loads(text[start:end].rstrip("\r"))
    except tomllib.TOMLDecodeError:
        # `zola build` already fails on this, so reporting it here adds nothing.
        return None


def publish_date(value):
    """Return the UTC calendar date a frontmatter `date` schedules, or None."""
    if isinstance(value, datetime.datetime):
        if value.tzinfo:
            value = value.astimezone(UTC)
        return value.date()
    if isinstance(value, datetime.date):
        return value
    if isinstance(value, str):
        try:
            return datetime.date.fromisoformat(value.strip()[:10])
        except ValueError:
            return None
    return None


def scheduled_posts(content_dir, today, window):
    """Return (date, title, repo-relative path) for drafts publishing in the window."""
    root = pathlib.Path(content_dir)
    if not root.is_dir():
        sys.exit(f"{root} not found; pass --content-dir")

    horizon = today + datetime.timedelta(days=window - 1)
    found = []
    for path in sorted(root.rglob("*.md")):
        if path.name == "_index.md":
            continue
        data = frontmatter(path.read_text(encoding="utf-8", errors="replace"))
        if not data or data.get("draft") is not True:
            continue
        date = publish_date(data.get("date"))
        if date is None or date < today or date > horizon:
            continue
        # The checkout directory is arbitrary, so report the path the repository
        # uses: links in the message have to resolve there.
        found.append((date, str(data.get("title", path.stem)), BLOG_PATH + str(path.relative_to(root))))
    return sorted(found)


def collect(repo, token, content_dir, today, window):
    """Gather every bucket the report prints."""
    org = repo.split("/")[0]
    teams = {}
    for slug in (COPY_TEAM, TECH_TEAM):
        members = team_members(org, slug, token)
        if members is None:
            sys.exit(
                f"cannot read the {org}/{slug} team; the token needs read:org "
                f"and membership in {org}"
            )
        teams[slug] = members

    pulls = get_all(f"{API}/repos/{repo}/pulls?state=open&per_page=100", token)

    report = {
        "copy": [],
        "technical": [],
        "author": [],
        "approved": [],
        "draft": [],
        "unlabeled": [],
        "scheduled": scheduled_posts(content_dir, today, window),
    }

    for pull in sorted(pulls, key=lambda p: p["updated_at"]):
        labels = {label["name"] for label in pull["labels"]}
        labeled = BLOG_LABEL in labels
        if labeled:
            touches_blog = True
        else:
            files = get_all(
                f"{API}/repos/{repo}/pulls/{pull['number']}/files?per_page=100", token
            )
            # Only an added file is a new post; a pull request that edits
            # published posts, like a Zola migration, is not in the queue.
            touches_blog = any(
                f["status"] == "added"
                and f["filename"].startswith(BLOG_PATH)
                and f["filename"].endswith(".md")
                for f in files
            )
        if not touches_blog:
            continue

        entry = {
            "number": pull["number"],
            "title": pull["title"],
            "url": pull["html_url"],
            "author": pull["user"]["login"],
            "updated_at": parse_time(pull["updated_at"]),
        }
        if not labeled:
            report["unlabeled"].append(entry)
        if pull["draft"]:
            report["draft"].append(entry)
            continue

        reviews = get_all(
            f"{API}/repos/{repo}/pulls/{pull['number']}/reviews?per_page=100", token
        )
        pushed_at = head_pushed_at(repo, pull, token)
        copy_turn = team_turn(reviews, teams[COPY_TEAM], pushed_at)

        # The technical team only reviews deep dives and announcements, so it
        # counts as involved once it has been asked or has already weighed in.
        requested = {team["slug"] for team in pull.get("requested_teams") or []}
        tech_reviewed = any(
            (review.get("user") or {}).get("login") in teams[TECH_TEAM]
            for review in reviews
        )
        if TECH_TEAM in requested or tech_reviewed:
            tech_turn = team_turn(reviews, teams[TECH_TEAM], pushed_at)
        else:
            tech_turn = None

        if copy_turn in ("unreviewed", "stale"):
            report["copy"].append({**entry, "turn": copy_turn})
        if tech_turn in ("unreviewed", "stale"):
            report["technical"].append({**entry, "turn": tech_turn})
        if copy_turn == "author" or tech_turn == "author":
            report["author"].append(entry)
        elif copy_turn == "approved" and tech_turn in (None, "approved"):
            report["approved"].append(entry)

    return report


def escape(text):
    """Escape the three characters Slack treats as markup."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def shorten(title):
    return title if len(title) <= TITLE_LIMIT else title[: TITLE_LIMIT - 1] + "…"


def pull_line(entry, now, slack, show_turn=False):
    """Render one pull request as a bullet, for Slack or for plain text."""
    idle = (now - entry["updated_at"]).days
    title = shorten(entry["title"])
    head = (
        f"<{entry['url']}|#{entry['number']} {escape(title)}>"
        if slack
        else f"#{entry['number']} {title} ({entry['url']})"
    )
    parts = [head, entry["author"], f"idle {idle}d"]
    if show_turn:
        parts.append(
            "no pass yet" if entry["turn"] == "unreviewed" else "updated since last pass"
        )
    return "• " + " · ".join(parts)


def build(report, repo, today, window, now, mention, applied):
    """Return (slack blocks, notification text, plain text report)."""
    horizon = today + datetime.timedelta(days=window - 1)
    sections = []

    def add(title, lines):
        if lines:
            sections.append((title, lines))

    add(
        f"Needs copy-editing ({len(report['copy'])})",
        [(pull_line(e, now, True, True), pull_line(e, now, False, True)) for e in report["copy"]],
    )
    add(
        f"Waiting on technical approval ({len(report['technical'])})",
        [(pull_line(e, now, True, True), pull_line(e, now, False, True)) for e in report["technical"]],
    )
    add(
        f"Publishing by {horizon:%a %-d %b} ({len(report['scheduled'])})",
        [
            (
                f"• *{date:%a %-d %b}* — <https://github.com/{repo}/blob/main/{path}|{escape(shorten(title))}>",
                f"• {date:%a %-d %b} — {shorten(title)} ({path})",
            )
            for date, title, path in report["scheduled"]
        ],
    )
    add(
        f"Waiting on the author ({len(report['author'])})",
        [(pull_line(e, now, True), pull_line(e, now, False)) for e in report["author"]],
    )
    add(
        f"Approved, not merged ({len(report['approved'])})",
        [(pull_line(e, now, True), pull_line(e, now, False)) for e in report["approved"]],
    )
    add(
        f"Could not be given the `{BLOG_LABEL}` label ({len(report['unlabeled'])})"
        if applied
        else f"Missing the `{BLOG_LABEL}` label ({len(report['unlabeled'])})",
        [(pull_line(e, now, True), pull_line(e, now, False)) for e in report["unlabeled"]],
    )
    add(
        f"Still a GitHub draft ({len(report['draft'])})",
        [(pull_line(e, now, True), pull_line(e, now, False)) for e in report["draft"]],
    )

    heading = f"Valkey blog review queue · {today:%-d %b %Y}"
    blocks = [{"type": "header", "text": {"type": "plain_text", "text": heading}}]
    if mention:
        blocks.append(
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"<!subteam^{mention}>"},
            }
        )

    plain = [heading]
    if not sections:
        blocks.append(
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": "The queue is empty."},
            }
        )
        plain.append("The queue is empty.")
    for title, lines in sections:
        plain.append("")
        plain.append(f"{title}:")
        plain.extend(line for _, line in lines)
        # A section holds as many bullets as fit; the rest continue in the next.
        chunk = f"*{title}*"
        for slack_line, _ in lines:
            if len(chunk) + len(slack_line) + 1 > SECTION_LIMIT:
                blocks.append(
                    {"type": "section", "text": {"type": "mrkdwn", "text": chunk}}
                )
                chunk = ""
            chunk = f"{chunk}\n{slack_line}" if chunk else slack_line
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": chunk}})

    counts = ", ".join(
        f"{len(report[key])} {label}"
        for key, label in (
            ("copy", "to copy-edit"),
            ("technical", "awaiting technical approval"),
            ("scheduled", "publishing this week"),
        )
    )
    return blocks, f"{heading}: {counts}", "\n".join(plain)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, help="owner/repo to report on")
    parser.add_argument(
        "--content-dir",
        default="content/blog",
        help="checkout of that repo's blog content, for scheduled drafts",
    )
    parser.add_argument("--out", help="write the Slack payload here")
    parser.add_argument(
        "--mention", default="", help="Slack user group ID to mention, e.g. S01234ABC"
    )
    parser.add_argument(
        "--window", type=int, default=7, help="days ahead to call 'this week'"
    )
    parser.add_argument(
        "--apply-labels",
        action="store_true",
        help=f"add the {BLOG_LABEL} label where it is missing, instead of only reporting it",
    )
    args = parser.parse_args()

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        sys.exit("GITHUB_TOKEN is required")

    now = datetime.datetime.now(UTC)
    today = now.date()
    report = collect(args.repo, token, args.content_dir, today, args.window)
    if args.apply_labels:
        report["unlabeled"] = [
            entry
            for entry in report["unlabeled"]
            if not add_blog_label(args.repo, entry["number"], token)
        ]
    blocks, text, plain = build(
        report, args.repo, today, args.window, now, args.mention, args.apply_labels
    )

    print(plain)
    if args.out:
        payload = {"text": text, "blocks": blocks, "unfurl_links": False}
        pathlib.Path(args.out).write_text(json.dumps(payload, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
