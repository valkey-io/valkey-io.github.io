/**
 * Client-side search powered by fuse.js over the index produced by
 * build/build-search-index.mjs (records: { url, title, heading, body }).
 * The index is fetched lazily on first interaction.
 *
 * Long pages are indexed as multiple section records whose urls share a base
 * path and differ only by "#anchor". All records for one page share the same
 * `title` (the page title); the section heading lives in `heading`. To keep
 * ranking fair, `heading` is weighted well below `title` so section records
 * neither dilute nor out-compete the page-name match, and results are capped
 * per base page (see MAX_PER_PAGE) so one page's sections cannot fill the whole
 * dropdown.
 */
(function () {
  "use strict";

  var SEARCH_INDEX_URL = "/search-index.json";
  var MAX_RESULTS = 8;
  // Cap on how many section results from the same base page (url without its
  // "#anchor") may appear, so a broad query still surfaces multiple pages.
  var MAX_PER_PAGE = 2;
  var DEBOUNCE_MS = 150;

  var input = document.getElementById("search-input");
  var resultsList = document.getElementById("search-results");
  // Live region for status messages (e.g. "No results found"). Kept outside the
  // listbox because a listbox must only own option/group children; a message
  // placed inside it would be exposed as a non-navigable option.
  var statusRegion = document.getElementById("search-status");

  if (!input || !resultsList || typeof Fuse === "undefined") {
    return;
  }

  var fuse = null;
  var indexPromise = null;
  var activeIndex = -1;
  var currentResults = [];
  // Bumped whenever the dropdown is dismissed so an in-flight search that
  // resolves later can tell it was superseded and skip rendering.
  var searchGeneration = 0;

  function setStatus(message) {
    if (statusRegion) {
      statusRegion.textContent = message || "";
    }
  }

  var fuseOptions = {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.4,
    minMatchCharLength: 2,
    keys: [
      { name: "title", weight: 0.6 },
      { name: "heading", weight: 0.15 },
      { name: "body", weight: 0.25 },
    ],
  };

  function loadIndex() {
    if (indexPromise) {
      return indexPromise;
    }

    indexPromise = fetch(SEARCH_INDEX_URL)
      .then(function (response) {
        if (!response.ok) {
          if (response.status === 404) {
            // Most common local cause: running under `zola serve`, which does
            // not generate or serve the post-build index. Point developers at
            // the fix instead of failing silently.
            throw new Error(
              SEARCH_INDEX_URL +
                " was not found (HTTP 404). Search will not work under `zola serve`, " +
                "which does not build the index. Run `npm run build` and serve the " +
                "`public/` directory statically. See the Search section of README.md."
            );
          }
          throw new Error("Failed to load search index: " + response.status);
        }
        return response.json();
      })
      .then(function (records) {
        fuse = new Fuse(records, fuseOptions);
        return fuse;
      })
      .catch(function (error) {
        indexPromise = null; // allow retry on a later interaction
        console.error(error);
        throw error;
      });

    return indexPromise;
  }

  // The base page of a record url is everything before the "#anchor".
  function basePage(url) {
    if (!url) {
      return url;
    }
    var hash = url.indexOf("#");
    return hash === -1 ? url : url.slice(0, hash);
  }

  // fuse returns results best-first; keep at most `limit` per base page so a
  // single long page's sections can't crowd out other pages. Order preserved.
  function capPerPage(results, limit) {
    var counts = Object.create(null);
    var kept = [];
    for (var i = 0; i < results.length; i++) {
      var page = basePage(results[i].item && results[i].item.url);
      var seen = counts[page] || 0;
      if (seen >= limit) {
        continue;
      }
      counts[page] = seen + 1;
      kept.push(results[i]);
    }
    return kept;
  }

  // Section bodies begin with the heading text (the indexer prepends it so the
  // heading is searchable in `body` too). The heading is already shown in the
  // result title, so strip that leading copy to avoid a redundant snippet.
  function makeSnippet(body, heading, maxLength) {
    if (!body) {
      return "";
    }
    var text = body.replace(/\s+/g, " ").trim();
    if (heading) {
      var h = heading.replace(/\s+/g, " ").trim();
      if (h && text.slice(0, h.length) === h) {
        text = text.slice(h.length).trim();
      }
    }
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength).trimEnd() + "\u2026";
  }

  function clearResults() {
    resultsList.innerHTML = "";
    resultsList.hidden = true;
    activeIndex = -1;
    currentResults = [];
    searchGeneration++;
    setStatus("");
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function renderResults(results) {
    currentResults = results;
    activeIndex = -1;
    resultsList.innerHTML = "";
    input.removeAttribute("aria-activedescendant");

    if (!results.length) {
      // Keep the listbox empty and hidden; announce via the status region so no
      // non-navigable "option" is exposed inside the listbox.
      resultsList.hidden = true;
      setStatus("No results found");
      input.setAttribute("aria-expanded", "false");
      return;
    }

    setStatus("");

    results.forEach(function (result, i) {
      var item = result.item;
      var li = document.createElement("li");
      li.className = "site-search__result";
      li.setAttribute("role", "option");
      li.id = "search-result-" + i;

      var link = document.createElement("a");
      link.href = item.url;
      link.className = "site-search__link";

      var title = document.createElement("span");
      title.className = "site-search__title";
      // Show the section heading (when present) after the page title so users
      // can tell which section a result points to, without it affecting rank.
      title.textContent =
        item.title && item.heading
          ? item.title + " \u203a " + item.heading
          : item.title || item.url;
      link.appendChild(title);

      var snippet = makeSnippet(item.body, item.heading, 90);
      if (snippet) {
        var desc = document.createElement("span");
        desc.className = "site-search__snippet";
        desc.textContent = snippet;
        link.appendChild(desc);
      }

      li.appendChild(link);
      resultsList.appendChild(li);
    });

    resultsList.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function runSearch(query) {
    var trimmed = query.trim();
    if (trimmed.length < 2) {
      clearResults();
      return;
    }

    // Capture the current generation so a resolve after a dismissal (Escape or
    // outside-click) is ignored. clearResults does not change input.value, so
    // the value check alone would let a dismissed search re-open the dropdown.
    var generation = searchGeneration;
    loadIndex()
      .then(function (index) {
        // Guard against a stale async response after the box was cleared or the
        // query changed.
        if (generation !== searchGeneration || input.value.trim() !== trimmed) {
          return;
        }
        var results = capPerPage(index.search(trimmed), MAX_PER_PAGE).slice(
          0,
          MAX_RESULTS
        );
        renderResults(results);
      })
      .catch(function () {
        clearResults();
      });
  }

  function setActive(nextIndex) {
    var items = resultsList.querySelectorAll(".site-search__result");
    if (!items.length) {
      return;
    }

    if (activeIndex > -1 && items[activeIndex]) {
      items[activeIndex].classList.remove("is-active");
    }

    activeIndex = ((nextIndex % items.length) + items.length) % items.length;
    var active = items[activeIndex];
    active.classList.add("is-active");
    active.scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", active.id);
  }

  var debounceTimer = null;
  input.addEventListener("input", function () {
    var value = input.value;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(function () {
      runSearch(value);
    }, DEBOUNCE_MS);
  });

  input.addEventListener("keydown", function (event) {
    var items = resultsList.querySelectorAll(".site-search__result");

    switch (event.key) {
      case "ArrowDown":
        if (items.length) {
          event.preventDefault();
          setActive(activeIndex + 1);
        }
        break;
      case "ArrowUp":
        if (items.length) {
          event.preventDefault();
          setActive(activeIndex - 1);
        }
        break;
      case "Enter":
        if (activeIndex > -1 && currentResults[activeIndex]) {
          event.preventDefault();
          window.location.href = currentResults[activeIndex].item.url;
        }
        break;
      case "Escape":
        clearResults();
        input.blur();
        break;
      default:
        break;
    }
  });

  // Close the dropdown when focus leaves the search widget.
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".site-search")) {
      clearResults();
    }
  });

  // Warm the index on first focus so the first query feels instant.
  input.addEventListener("focus", function () {
    loadIndex().catch(function () {});
  });
})();
