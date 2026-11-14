#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""Lists the searches in a cases file that don't show their expected page high enough on a built
site, one "key<TAB>message" line each.

    build/check-search-ranking.py build/search-ranking.toml public

Each case in the file is a query, the page it should show, and how many of the first results that
page can be in:

    [[search]]
    query = "ACL USERS"
    url = "/commands/acl-users/"
    top = 1

Searches are performed in headless Chrome, through the site search. Uses the Chrome at $CHROME, or
google-chrome. Exits 0 if every search shows its page, 1 if not, and 2 if it couldn't check (such as
a site with no search, or no Chrome).
"""

import functools
import http.server
import json
import os
import pathlib
import queue
import subprocess
import sys
import tempfile
import threading
import time
import tomllib

TIMEOUT_SECONDS = 180

# Loads the site in a frame and searches through it as a visitor would.
CHECK_PAGE = """<!DOCTYPE html>
<iframe src="/"></iframe>
<script>
const CASES = CASES_JSON;

document.querySelector("iframe").addEventListener("load", async function () {
    const site = this.contentWindow;
    let report;
    try {
        if (!site.document.querySelector("pagefind-modal-trigger")) throw new Error("the site has no search button");
        const instance = site.PagefindComponents.getInstanceManager().getInstance("default");
        let resolveResults;
        instance.on("results", function (result) { resolveResults(result); });
        const misses = [];
        for (const searchCase of CASES) {
            const result = await new Promise(function (resolve) { resolveResults = resolve; instance.triggerSearch(searchCase.query); });
            const top = await Promise.all(result.results.slice(0, searchCase.top).map(async function (match) { return (await match.data()).url; }));
            if (!top.includes(searchCase.url)) misses.push({ ...searchCase, got: top });
        }
        report = { misses };
    } catch (error) {
        report = { error: String(error.message || error) };
    }
    fetch("/report", { method: "POST", body: JSON.stringify(report) });
});
</script>
"""


def search_in_chrome(public, check_page):
    """Serves the site with the check page, opens it in Chrome and returns what it reports."""
    reports = queue.Queue()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path != "/check":
                return super().do_GET()
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(check_page.encode())

        def do_POST(self):
            reports.put(json.loads(self.rfile.read(int(self.headers["Content-Length"]))))
            self.send_response(204)
            self.end_headers()

        def log_message(self, *args):
            pass

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=public))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with tempfile.TemporaryDirectory() as profile:
        chrome = subprocess.Popen(
            [
                os.environ.get("CHROME", "google-chrome"),
                "--headless=new",
                "--no-first-run",
                f"--user-data-dir={profile}",
                # Other hosts, such as analytics, would make the check depend on the network.
                "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
                f"http://127.0.0.1:{server.server_port}/check",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            deadline = time.monotonic() + TIMEOUT_SECONDS
            while time.monotonic() < deadline:
                try:
                    return reports.get(timeout=1)
                except queue.Empty:
                    if chrome.poll() is not None:
                        raise RuntimeError(f"Chrome exited with code {chrome.returncode} before the searches finished")
            raise RuntimeError(f"the searches didn't finish within {TIMEOUT_SECONDS} seconds")
        finally:
            chrome.kill()
            chrome.wait()
            server.shutdown()


def describe(miss):
    place = "first" if miss["top"] == 1 else f"in the top {miss['top']}"
    got = ", ".join(miss["got"]) or "nothing"
    return f'Searching "{miss["query"]}" should show {miss["url"]} {place}, but shows {got}.'


def main():
    if len(sys.argv) != 3:
        print(f"usage: {pathlib.Path(sys.argv[0]).name} <cases file> <built site>", file=sys.stderr)
        return 2
    cases_file, public = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    if not public.is_dir():
        print(f"error: {public} isn't a directory", file=sys.stderr)
        return 2
    cases = [
        {"query": search["query"], "url": search["url"], "top": search["top"]}
        for search in tomllib.loads(cases_file.read_text())["search"]
    ]

    try:
        # Escaping < keeps a query like "</script>" from ending the check page's script.
        cases_json = json.dumps(cases).replace("<", "\\u003c")
        report = search_in_chrome(public, CHECK_PAGE.replace("CASES_JSON", cases_json))
    except FileNotFoundError as error:
        print(f"error: couldn't start Chrome: {error}", file=sys.stderr)
        return 2
    except RuntimeError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    if "error" in report:
        print(f"error: the searches failed: {report['error']}", file=sys.stderr)
        return 2

    misses = report["misses"]
    print(f"{len(cases)} searches checked, {len(misses)} not showing their page", file=sys.stderr)
    for miss in misses:
        print(f"{miss['query']} -> {miss['url']}\t{describe(miss)}")
    return 1 if misses else 0


if __name__ == "__main__":
    sys.exit(main())
