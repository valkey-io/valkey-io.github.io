/**
 * Client-side search powered by fuse.js over the index produced by
 * build/build-search-index.mjs (records: { url, title, body }).
 * The index is fetched lazily on first interaction.
 */
(function () {
  "use strict";

  var SEARCH_INDEX_URL = "/search-index.json";
  var MAX_RESULTS = 8;
  var DEBOUNCE_MS = 150;

  var input = document.getElementById("search-input");
  var resultsList = document.getElementById("search-results");

  if (!input || !resultsList || typeof Fuse === "undefined") {
    return;
  }

  var fuse = null;
  var indexPromise = null;
  var activeIndex = -1;
  var currentResults = [];

  var fuseOptions = {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.4,
    minMatchCharLength: 2,
    keys: [
      { name: "title", weight: 0.7 },
      { name: "body", weight: 0.3 },
    ],
  };

  function loadIndex() {
    if (indexPromise) {
      return indexPromise;
    }

    indexPromise = fetch(SEARCH_INDEX_URL)
      .then(function (response) {
        if (!response.ok) {
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

  function makeSnippet(body, maxLength) {
    if (!body) {
      return "";
    }
    var text = body.replace(/\s+/g, " ").trim();
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
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function renderResults(results) {
    currentResults = results;
    activeIndex = -1;
    resultsList.innerHTML = "";
    input.removeAttribute("aria-activedescendant");

    if (!results.length) {
      var empty = document.createElement("li");
      empty.className = "site-search__empty";
      empty.setAttribute("role", "option");
      empty.textContent = "No results found";
      resultsList.appendChild(empty);
      resultsList.hidden = false;
      input.setAttribute("aria-expanded", "true");
      return;
    }

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
      title.textContent = item.title || item.url;
      link.appendChild(title);

      var snippet = makeSnippet(item.body, 90);
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

    loadIndex()
      .then(function (index) {
        // Guard against a stale async response after the box was cleared.
        if (input.value.trim() !== trimmed) {
          return;
        }
        var results = index.search(trimmed).slice(0, MAX_RESULTS);
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
