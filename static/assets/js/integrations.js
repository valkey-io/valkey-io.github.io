/*
 * integrations.js — Integrations catalog page (/integrations/).
 *
 * Progressive-enhancement controller for the pre-rendered integration cards
 * (tools + AI). Same two-layer shape as clients.js:
 *   1. A pure-logic core: side-effect-free functions that decide which cards to
 *      show, hide, and reorder.
 *   2. DOM wiring on top that reads pre-rendered card attributes and calls the
 *      pure functions. It never builds cards from data.
 *
 * There is no intent switcher. The single facet is Tags/Category (multi-select,
 * OR semantics). A global "Valkey Project" toggle narrows to first-party
 * entries and composes as AND with the facet and the search text.
 *
 * Card descriptor shape (read from data-* attributes):
 *   { el, tags:string[], firstParty:boolean, search, nameLower }
 *
 * Interaction state shape:
 *   {
 *     tags:          Set<string>,   // multi-select facet, OR; empty = all
 *     firstPartyOnly: boolean,      // Valkey Project toggle
 *     search:        string,        // lowercased
 *     sort:          "name-asc"
 *   }
 */

(function (root, factory) {
  var api = factory();
  if (typeof root !== "undefined") {
    root.IntegrationsCatalog = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function toSet(values) {
    if (values instanceof Set) return values;
    var s = new Set();
    if (Array.isArray(values)) {
      for (var i = 0; i < values.length; i++) s.add(values[i]);
    }
    return s;
  }

  function cardTags(card) {
    return Array.isArray(card && card.tags) ? card.tags : [];
  }

  // Tags facet, OR semantics; empty selection matches all.
  function matchesFacet(card, state) {
    var tags = toSet(state.tags);
    if (tags.size === 0) return true;
    var ct = cardTags(card);
    for (var i = 0; i < ct.length; i++) {
      if (tags.has(ct[i])) return true;
    }
    return false;
  }

  function matchesFirstParty(card, state) {
    return !state.firstPartyOnly || card.firstParty === true;
  }

  function matchesSearch(card, search) {
    if (!search) return true;
    var q = String(search).toLowerCase();
    var hay = (card.search || "").toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function computeVisible(cards, state) {
    var list = Array.isArray(cards) ? cards : [];
    var st = state || {};
    var search = st.search || "";
    return list.filter(function (c) {
      return (
        c &&
        matchesFacet(c, st) &&
        matchesFirstParty(c, st) &&
        matchesSearch(c, search)
      );
    });
  }

  function sortVisible(visible) {
    var list = Array.isArray(visible) ? visible.slice() : [];
    var decorated = list.map(function (card, index) {
      return { card: card, index: index };
    });
    decorated.sort(function (a, b) {
      var na = ((a.card && a.card.nameLower) || "").toLowerCase();
      var nb = ((b.card && b.card.nameLower) || "").toLowerCase();
      if (na < nb) return -1;
      if (na > nb) return 1;
      return a.index - b.index;
    });
    return decorated.map(function (d) {
      return d.card;
    });
  }

  // Live count for a single tag-value pill: cards satisfying the current search
  // and first-party toggle whose tag list includes `value`. Other facet
  // selections are ignored. The "All" pill counts every searched, toggle-
  // eligible card.
  function pillCount(cards, value, state) {
    var list = Array.isArray(cards) ? cards : [];
    var st = state || {};
    var search = st.search || "";
    var count = 0;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c) continue;
      if (!matchesSearch(c, search)) continue;
      if (!matchesFirstParty(c, st)) continue;
      var ok;
      if (value === null || value === undefined || value === "__all__") {
        ok = true;
      } else {
        ok = cardTags(c).indexOf(value) !== -1;
      }
      if (ok) count += 1;
    }
    return count;
  }

  function clearedFilterState(state) {
    return {
      tags: new Set(),
      firstPartyOnly: false,
      search: state.search || "",
      sort: state.sort || "name-asc",
    };
  }

  function clearedSearchState(state) {
    return {
      tags: toSet(state.tags),
      firstPartyOnly: !!state.firstPartyOnly,
      search: "",
      sort: state.sort || "name-asc",
    };
  }

  function clearedAllState(state) {
    return {
      tags: new Set(),
      firstPartyOnly: false,
      search: "",
      sort: state.sort || "name-asc",
    };
  }

  function recovery(cards, state) {
    var list = Array.isArray(cards) ? cards : [];
    var st = state || {};
    var suggestions = [];

    function nonEmptyUnder(patch) {
      return computeVisible(list, patch).length > 0;
    }

    var hasFilter = toSet(st.tags).size > 0 || !!st.firstPartyOnly;
    var filterPatch = clearedFilterState(st);
    if (hasFilter && nonEmptyUnder(filterPatch)) {
      suggestions.push({
        action: "clear-filters",
        label: "Clear filters",
        patch: filterPatch,
      });
    }

    var searchPatch = clearedSearchState(st);
    if (st.search && nonEmptyUnder(searchPatch)) {
      suggestions.push({
        action: "clear-search",
        label: "Clear search",
        patch: searchPatch,
      });
    }

    if (suggestions.length === 0) {
      var allPatch = clearedAllState(st);
      if (nonEmptyUnder(allPatch)) {
        suggestions.push({
          action: "clear-all",
          label: "Clear search and filters",
          patch: allPatch,
        });
      }
    }

    return suggestions.slice(0, 5);
  }

  return {
    computeVisible: computeVisible,
    sortVisible: sortVisible,
    pillCount: pillCount,
    recovery: recovery,
  };
});

/*
 * DOM wiring layer, built on top of the pure-logic core above. Mirrors
 * clients.js: sets the scripting flag, reads pre-rendered card DOM into plain
 * descriptors, holds interaction state, runs apply(), refreshes pill counts,
 * reveals/hides the empty state, and wires the tag pills, the Valkey Project
 * toggle, debounced search, sort, and the copy button.
 *
 * Exposed as IntegrationsCatalog.initDom(root); auto-initializes on
 * DOMContentLoaded when an integrations catalog page is present.
 */

(function (root) {
  "use strict";

  var api = root && root.IntegrationsCatalog;
  if (!api) return;

  var HIDDEN_CLASS = "is-hidden";
  var SEARCH_DEBOUNCE_MS = 120;
  var COPY_RESET_MS = 1500;
  var FACET_ALL = "__all__";

  function q(el, sel) {
    return el.querySelector(sel);
  }
  function qa(el, sel) {
    return Array.prototype.slice.call(el.querySelectorAll(sel));
  }

  function setScriptingFlag(doc) {
    if (doc && doc.documentElement) {
      doc.documentElement.classList.add("js");
    }
  }

  function readCardDescriptor(cardEl) {
    var tagsAttr = cardEl.getAttribute("data-tags") || "";
    return {
      el: cardEl,
      tags: tagsAttr
        ? tagsAttr.split("|").filter(function (t) {
            return t !== "";
          })
        : [],
      firstParty: cardEl.getAttribute("data-first-party") === "true",
      search: cardEl.getAttribute("data-search") || "",
      nameLower: cardEl.getAttribute("data-name-lower") || "",
    };
  }

  function Controller(root) {
    this.root = root;
    this.doc = root.ownerDocument || root.document || document;

    this.catalogRoot = q(root, "[data-catalog-root]") || root;
    this.grid = q(root, "[data-catalog]");
    this.searchInput = q(root, "[data-search-input]");
    this.sortControl = q(root, "[data-sort-control]");
    this.emptyState = q(root, "[data-empty-state]");
    this.facetBar = q(root, '[data-facet="tags"]');
    this.toggleBtn = q(root, "[data-first-party-toggle]");

    this.cardEls = this.grid ? qa(this.grid, ".entry-card") : [];
    this.cards = this.cardEls.map(readCardDescriptor);

    this.state = {
      tags: new Set(),
      firstPartyOnly: false,
      search: "",
      sort: "name-asc",
    };

    this._searchTimer = null;
    this._copyTimers = [];
  }

  Controller.prototype.apply = function () {
    var visible = api.computeVisible(this.cards, this.state);
    var ordered = api.sortVisible(visible);

    var visibleSet = new Set(
      visible.map(function (c) {
        return c.el;
      })
    );

    for (var i = 0; i < this.cards.length; i++) {
      var el = this.cards[i].el;
      if (visibleSet.has(el)) {
        el.classList.remove(HIDDEN_CLASS);
        el.removeAttribute("hidden");
      } else {
        el.classList.add(HIDDEN_CLASS);
      }
    }

    if (this.grid) {
      for (var j = 0; j < ordered.length; j++) {
        this.grid.appendChild(ordered[j].el);
      }
    }

    this.refreshPillCounts();
    this.updateEmptyState(ordered.length);
  };

  Controller.prototype.refreshPillCounts = function () {
    var bar = this.facetBar;
    if (!bar) return;
    var self = this;
    qa(bar, ".filter-pill").forEach(function (pill) {
      var slot = q(pill, "[data-count]");
      if (!slot) return;
      var value = pill.getAttribute("data-value");
      var facetValue = value === FACET_ALL ? null : value;
      slot.textContent = String(api.pillCount(self.cards, facetValue, self.state));
    });
  };

  Controller.prototype.updateEmptyState = function (visibleCount) {
    if (!this.emptyState) return;
    if (visibleCount > 0) {
      this.emptyState.hidden = true;
      return;
    }
    this.emptyState.hidden = false;
    try {
      this.renderRecovery();
    } catch (e) {
      if (root.console && root.console.warn) {
        root.console.warn("integrations: recovery rendering failed", e);
      }
    }
  };

  Controller.prototype.renderRecovery = function () {
    var list = q(this.emptyState, "[data-recovery]");
    if (!list) return;
    var suggestions = api.recovery(this.cards, this.state) || [];
    var self = this;
    var doc = this.doc;

    while (list.firstChild) list.removeChild(list.firstChild);

    suggestions.slice(0, 5).forEach(function (s) {
      var li = doc.createElement("li");
      var btn = doc.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-recover", s.action);
      btn.textContent = s.label;
      btn.addEventListener("click", function () {
        self.applyRecovery(s);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  };

  Controller.prototype.applyRecovery = function (suggestion) {
    var patch = suggestion.patch || {};
    this.state.tags = patch.tags instanceof Set ? patch.tags : new Set();
    this.state.firstPartyOnly = !!patch.firstPartyOnly;
    this.state.search = patch.search || "";
    if (patch.sort) this.state.sort = patch.sort;

    if (this.searchInput) this.searchInput.value = this.state.search;
    this.syncPillPressedState();
    this.syncToggleState();
    this.apply();
  };

  Controller.prototype.onPillClick = function (pill) {
    var value = pill.getAttribute("data-value");
    if (value === FACET_ALL) {
      this.state.tags = new Set();
    } else {
      this.toggleInSet(this.state.tags, value);
    }
    this.syncPillPressedState();
    this.apply();
  };

  Controller.prototype.toggleInSet = function (set, value) {
    if (set.has(value)) set.delete(value);
    else set.add(value);
  };

  Controller.prototype.syncPillPressedState = function () {
    var bar = this.facetBar;
    if (!bar) return;
    var tags = this.state.tags;
    qa(bar, ".filter-pill").forEach(function (pill) {
      var value = pill.getAttribute("data-value");
      var pressed = value === FACET_ALL ? tags.size === 0 : tags.has(value);
      pill.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
  };

  Controller.prototype.onToggle = function () {
    this.state.firstPartyOnly = !this.state.firstPartyOnly;
    this.syncToggleState();
    this.apply();
  };

  Controller.prototype.syncToggleState = function () {
    if (!this.toggleBtn) return;
    var on = this.state.firstPartyOnly;
    this.toggleBtn.setAttribute("aria-checked", on ? "true" : "false");
    this.toggleBtn.classList.toggle("is-on", on);
  };

  Controller.prototype.onCopyClick = function (btn) {
    var command = btn.getAttribute("data-copy") || "";
    var self = this;
    function indicate(cls, text) {
      btn.classList.remove("is-copied", "is-failed");
      btn.classList.add(cls);
      if (!btn.getAttribute("data-label")) {
        btn.setAttribute("data-label", btn.textContent);
      }
      btn.textContent = text;
      var timer = root.setTimeout(function () {
        btn.classList.remove(cls);
        btn.textContent = btn.getAttribute("data-label");
      }, COPY_RESET_MS);
      self._copyTimers.push(timer);
    }

    var clipboard = root.navigator && root.navigator.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      clipboard.writeText(command).then(
        function () {
          indicate("is-copied", "Copied");
        },
        function () {
          indicate("is-failed", "Copy failed");
        }
      );
    } else {
      indicate("is-failed", "Copy failed");
    }
  };

  Controller.prototype.bind = function () {
    var self = this;

    if (this.facetBar) {
      this.facetBar.addEventListener("click", function (ev) {
        var pill = ev.target.closest ? ev.target.closest(".filter-pill") : null;
        if (pill && self.facetBar.contains(pill)) self.onPillClick(pill);
      });
    }

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", function () {
        self.onToggle();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener("input", function () {
        if (self._searchTimer) root.clearTimeout(self._searchTimer);
        self._searchTimer = root.setTimeout(function () {
          self.state.search = self.searchInput.value.toLowerCase();
          self.apply();
        }, SEARCH_DEBOUNCE_MS);
      });
    }

    if (this.sortControl) {
      this.sortControl.addEventListener("change", function () {
        self.state.sort = self.sortControl.value || "name-asc";
        self.apply();
      });
    }

    if (this.grid) {
      this.grid.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest(".copy-btn") : null;
        if (btn && self.grid.contains(btn)) self.onCopyClick(btn);
      });
    }

    if (this.emptyState) {
      var recoveryList = q(this.emptyState, "[data-recovery]");
      if (recoveryList) {
        recoveryList.addEventListener("click", function (ev) {
          var btn = ev.target.closest ? ev.target.closest("[data-recover]") : null;
          if (!btn || !recoveryList.contains(btn)) return;
          var action = btn.getAttribute("data-recover");
          if (action === "clear-filters") {
            self.state.tags = new Set();
            self.state.firstPartyOnly = false;
            self.syncPillPressedState();
            self.syncToggleState();
            self.apply();
          } else if (action === "clear-search") {
            self.state.search = "";
            if (self.searchInput) self.searchInput.value = "";
            self.apply();
          }
        });
      }
    }
  };

  Controller.prototype.init = function () {
    setScriptingFlag(this.doc);
    this.bind();
    this.syncPillPressedState();
    this.syncToggleState();
    this.apply();
    if (this.catalogRoot && this.catalogRoot.classList) {
      this.catalogRoot.classList.add("catalog-ready");
    }
    return this;
  };

  function initDom(rootEl) {
    var host = rootEl || (root.document ? root.document : null);
    if (!host) return null;
    if (host.querySelector && !host.querySelector('[data-catalog-root][data-page="integrations"]')) {
      return null;
    }
    var scope = host.querySelector('[data-catalog-root][data-page="integrations"]') || host;
    return new Controller(scope).init();
  }

  api.initDom = initDom;
  api.Controller = Controller;

  if (root.document && root.document.addEventListener) {
    root.document.addEventListener("DOMContentLoaded", function () {
      setScriptingFlag(root.document);
      if (root.document.querySelector('[data-catalog-root][data-page="integrations"]')) {
        initDom(root.document);
      }
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
