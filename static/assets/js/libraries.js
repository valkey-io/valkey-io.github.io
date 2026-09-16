/*
 * libraries.js — merged Libraries catalog page (/clients/ and /integrations/).
 *
 * One controller drives BOTH catalogs on a single page and a two-way
 * Clients ↔ Integrations segmented toggle. Same two-layer shape as the old
 * clients.js / integrations.js it replaces:
 *   1. A pure-logic core: side-effect-free functions (no DOM, clipboard, or
 *      timers) that partition cards by kind and decide which cards of the
 *      ACTIVE kind to show, hide, and reorder.
 *   2. DOM wiring on top: reads pre-rendered card attributes, holds interaction
 *      state, listens to events, and calls the pure functions. It never builds
 *      cards from data.
 *
 * Each card carries data-catalog-kind ("clients" | "integrations"). Only cards
 * of the active kind can be visible; the inactive kind is always hidden. Within
 * the active kind the facet (Language for clients, Tags for integrations), the
 * Valkey (first-party) toggle, the search text, and the reversible sort all
 * compose exactly as on the old single-kind pages.
 *
 * Card descriptor shape (read from data-* attributes):
 *   { el, kind, language|null, tags:string[], firstParty:boolean,
 *     search, nameLower }
 *
 * Interaction state shape:
 *   {
 *     kind:          "clients" | "integrations",  // active catalog kind
 *     facets: {                                    // per-kind facet selections
 *       clients:      Set<string>,                 // languages (OR; empty=all)
 *       integrations: Set<string>,                 // tags (OR; empty=all)
 *     },
 *     firstPartyOnly: boolean,                      // Valkey toggle
 *     search:        string,                        // lowercased
 *     sortDir:       "asc" | "desc",
 *   }
 */

(function (root, factory) {
  var api = factory();
  if (typeof root !== "undefined") {
    root.LibrariesCatalog = api;
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

  // Split a card list into { clients: [...], integrations: [...] } by kind.
  function partitionByKind(cards) {
    var list = Array.isArray(cards) ? cards : [];
    var out = { clients: [], integrations: [] };
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c) continue;
      if (c.kind === "clients") out.clients.push(c);
      else if (c.kind === "integrations") out.integrations.push(c);
    }
    return out;
  }

  // The facet values selected for the active kind.
  function activeFacet(state) {
    var facets = (state && state.facets) || {};
    return toSet(facets[state.kind]);
  }

  // Facet match against the active kind's selection. Clients match on their
  // single `language`; integrations match on ANY of their `tags` (OR). An empty
  // selection matches all cards of that kind.
  function matchesFacet(card, state) {
    var sel = activeFacet(state);
    if (sel.size === 0) return true;
    if (card.kind === "clients") {
      return card.language !== null && sel.has(card.language);
    }
    var ct = cardTags(card);
    for (var i = 0; i < ct.length; i++) {
      if (sel.has(ct[i])) return true;
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

  // A card is visible iff it is of the ACTIVE kind AND matches the active-kind
  // facet, the first-party toggle, and the search text. Preserves input order
  // so a later stable sort can rely on it.
  function computeVisible(cards, state) {
    var list = Array.isArray(cards) ? cards : [];
    var st = state || {};
    var search = st.search || "";
    return list.filter(function (c) {
      return (
        c &&
        c.kind === st.kind &&
        matchesFacet(c, st) &&
        matchesFirstParty(c, st) &&
        matchesSearch(c, search)
      );
    });
  }

  // Direction-aware stable sort by nameLower. `direction` is "asc" (default) or
  // "desc"; ties keep original input order in both directions (stable).
  function sortVisible(visible, direction) {
    var list = Array.isArray(visible) ? visible.slice() : [];
    var desc = direction === "desc";
    var decorated = list.map(function (card, index) {
      return { card: card, index: index };
    });
    decorated.sort(function (a, b) {
      var na = ((a.card && a.card.nameLower) || "").toLowerCase();
      var nb = ((b.card && b.card.nameLower) || "").toLowerCase();
      if (na < nb) return desc ? 1 : -1;
      if (na > nb) return desc ? -1 : 1;
      return a.index - b.index;
    });
    return decorated.map(function (d) {
      return d.card;
    });
  }

  // Live count for a single facet-value pill within the active kind: cards of
  // the active kind satisfying the current search and first-party toggle whose
  // facet value includes `value`. Other facet selections are ignored so the
  // count reflects "how many would match if this pill were active". The "All"
  // pill (null/"__all__") counts every searched, toggle-eligible active-kind
  // card.
  function pillCount(cards, value, state) {
    var list = Array.isArray(cards) ? cards : [];
    var st = state || {};
    var search = st.search || "";
    var count = 0;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c) continue;
      if (c.kind !== st.kind) continue;
      if (!matchesSearch(c, search)) continue;
      if (!matchesFirstParty(c, st)) continue;
      var ok;
      if (value === null || value === undefined || value === "__all__") {
        ok = true;
      } else if (c.kind === "clients") {
        ok = c.language === value;
      } else {
        ok = cardTags(c).indexOf(value) !== -1;
      }
      if (ok) count += 1;
    }
    return count;
  }

  // Recovery suggestions for an empty active-kind result. Mirrors the old
  // per-page logic but scoped to the active kind via computeVisible.
  function withActiveFacet(state, set) {
    var facets = {};
    var src = (state && state.facets) || {};
    facets.clients = toSet(src.clients);
    facets.integrations = toSet(src.integrations);
    facets[state.kind] = set;
    return facets;
  }

  function baseState(state, overrides) {
    var st = state || {};
    var patch = {
      kind: st.kind,
      facets: withActiveFacet(st, toSet((st.facets || {})[st.kind])),
      firstPartyOnly: !!st.firstPartyOnly,
      search: st.search || "",
      sortDir: st.sortDir || "asc",
    };
    for (var k in overrides) {
      if (Object.prototype.hasOwnProperty.call(overrides, k)) patch[k] = overrides[k];
    }
    return patch;
  }

  function clearedFilterState(state) {
    return baseState(state, {
      facets: withActiveFacet(state, new Set()),
      firstPartyOnly: false,
    });
  }

  function clearedSearchState(state) {
    return baseState(state, { search: "" });
  }

  function clearedAllState(state) {
    return baseState(state, {
      facets: withActiveFacet(state, new Set()),
      firstPartyOnly: false,
      search: "",
    });
  }

  function recovery(cards, state) {
    var list = Array.isArray(cards) ? cards : [];
    var st = state || {};
    var suggestions = [];

    function nonEmptyUnder(patch) {
      return computeVisible(list, patch).length > 0;
    }

    var hasFilter = activeFacet(st).size > 0 || !!st.firstPartyOnly;
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
    partitionByKind: partitionByKind,
    computeVisible: computeVisible,
    sortVisible: sortVisible,
    pillCount: pillCount,
    recovery: recovery,
  };
});

/*
 * DOM wiring layer, built on top of the pure-logic core above. Sets the
 * scripting `js` flag, reads pre-rendered card DOM into plain descriptors,
 * holds interaction state, runs apply() (computeVisible + sortVisible to toggle
 * a hidden class and reorder nodes), refreshes live pill counts on the active
 * facet bar, reveals/hides the empty state and builds recovery, and wires the
 * kind switch, the per-kind facet pills, the Valkey toggle, debounced search,
 * the reversible sort button, and the copy buttons.
 *
 * Exposed as LibrariesCatalog.initDom(root); auto-initializes on
 * DOMContentLoaded when a libraries catalog page is present.
 */

(function (root) {
  "use strict";

  var api = root && root.LibrariesCatalog;
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

  // Read pre-rendered data-* attributes into the plain descriptor the pure
  // logic operates on. No card construction.
  function readCardDescriptor(cardEl) {
    var kind = cardEl.getAttribute("data-catalog-kind") || "";
    var langAttr = cardEl.getAttribute("data-language");
    var tagsAttr = cardEl.getAttribute("data-tags") || "";
    return {
      el: cardEl,
      kind: kind,
      language: langAttr ? langAttr : null,
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
    this.toggleBtn = q(root, "[data-first-party-toggle]");
    this.kindSwitch = q(root, "[data-kind-switch]");

    // Facet bars keyed by kind (each carries data-catalog-kind).
    this.facetBars = {
      clients: q(root, '.filterbar[data-catalog-kind="clients"]'),
      integrations: q(root, '.filterbar[data-catalog-kind="integrations"]'),
    };

    this.cardEls = this.grid ? qa(this.grid, ".entry-card") : [];
    this.cards = this.cardEls.map(readCardDescriptor);

    var defaultKind =
      this.catalogRoot.getAttribute("data-default-kind") === "integrations"
        ? "integrations"
        : "clients";

    this.state = {
      kind: defaultKind,
      facets: { clients: new Set(), integrations: new Set() },
      firstPartyOnly: false,
      search: "",
      sortDir: "asc",
    };

    this._searchTimer = null;
    this._copyTimers = [];
  }

  // The active kind's facet bar, or null.
  Controller.prototype.activeFacetBar = function () {
    return this.facetBars[this.state.kind] || null;
  };

  // The core render pass: compute visibility + order for the active kind,
  // toggle the hidden class on every card, reorder active-kind nodes in place,
  // refresh pill counts, reveal/hide the empty state.
  Controller.prototype.apply = function () {
    var visible = api.computeVisible(this.cards, this.state);
    var ordered = api.sortVisible(visible, this.state.sortDir);

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
    var bar = this.activeFacetBar();
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
        root.console.warn("libraries: recovery rendering failed", e);
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
    if (patch.facets) {
      this.state.facets.clients =
        patch.facets.clients instanceof Set ? patch.facets.clients : new Set();
      this.state.facets.integrations =
        patch.facets.integrations instanceof Set ? patch.facets.integrations : new Set();
    }
    this.state.firstPartyOnly = !!patch.firstPartyOnly;
    this.state.search = patch.search || "";

    if (this.searchInput) this.searchInput.value = this.state.search;
    this.syncPillPressedState();
    this.syncToggleState();
    this.apply();
  };

  // --- Kind switch --------------------------------------------------------

  Controller.prototype.onKindSwitch = function (kind) {
    if (kind !== "clients" && kind !== "integrations") return;
    if (kind === this.state.kind) return;
    this.state.kind = kind;
    this.syncKindState();
    // Facet pressed-state and counts are per-kind; refresh for the new active
    // bar. The first-party toggle, search, and sort direction persist.
    this.syncPillPressedState();
    this.apply();
  };

  // Reflect the active kind: aria-selected on the switch options and
  // data-active-kind on the root (CSS uses it to reveal the active header,
  // facet bar, and — for clients — the legend). Also keep the search box's
  // aria in step is unnecessary; the placeholder is generic.
  Controller.prototype.syncKindState = function () {
    var kind = this.state.kind;
    if (this.kindSwitch) {
      qa(this.kindSwitch, ".kind-opt").forEach(function (opt) {
        var on = opt.getAttribute("data-kind") === kind;
        opt.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    if (this.catalogRoot) {
      this.catalogRoot.setAttribute("data-active-kind", kind);
    }
  };

  // --- Facet pills --------------------------------------------------------

  Controller.prototype.onPillClick = function (pill) {
    var value = pill.getAttribute("data-value");
    var set = this.state.facets[this.state.kind];
    if (value === FACET_ALL) {
      this.state.facets[this.state.kind] = new Set();
    } else {
      this.toggleInSet(set, value);
    }
    this.syncPillPressedState();
    this.apply();
  };

  Controller.prototype.toggleInSet = function (set, value) {
    if (set.has(value)) set.delete(value);
    else set.add(value);
  };

  // Reflect selection state in aria-pressed on the active kind's pills. The
  // "All" pill is pressed exactly when no value is selected for that kind.
  Controller.prototype.syncPillPressedState = function () {
    var bar = this.activeFacetBar();
    if (!bar) return;
    var sel = this.state.facets[this.state.kind];
    qa(bar, ".filter-pill").forEach(function (pill) {
      var value = pill.getAttribute("data-value");
      var pressed = value === FACET_ALL ? sel.size === 0 : sel.has(value);
      pill.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
  };

  // --- Valkey (first-party) toggle ---------------------------------------

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

  // --- Reversible sort ----------------------------------------------------

  Controller.prototype.onSortToggle = function () {
    this.state.sortDir = this.state.sortDir === "asc" ? "desc" : "asc";
    this.syncSortState();
    this.apply();
  };

  Controller.prototype.syncSortState = function () {
    if (!this.sortControl) return;
    var desc = this.state.sortDir === "desc";
    var textEl = q(this.sortControl, "[data-sort-text]");
    if (textEl) textEl.textContent = desc ? "Name Z–A" : "Name A–Z";
    this.sortControl.setAttribute("aria-pressed", desc ? "true" : "false");
    this.sortControl.setAttribute(
      "aria-label",
      desc
        ? "Sort by name, descending Z to A. Activate to reverse."
        : "Sort by name, ascending A to Z. Activate to reverse."
    );
    this.sortControl.classList.toggle("is-desc", desc);
  };

  // --- Copy button --------------------------------------------------------

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

  // --- Wiring -------------------------------------------------------------

  Controller.prototype.bind = function () {
    var self = this;

    if (this.kindSwitch) {
      this.kindSwitch.addEventListener("click", function (ev) {
        var opt = ev.target.closest ? ev.target.closest(".kind-opt") : null;
        if (opt && self.kindSwitch.contains(opt)) {
          self.onKindSwitch(opt.getAttribute("data-kind"));
        }
      });
    }

    // One delegated listener per facet bar (both kinds), scoped by the bar.
    ["clients", "integrations"].forEach(function (kind) {
      var bar = self.facetBars[kind];
      if (!bar) return;
      bar.addEventListener("click", function (ev) {
        var pill = ev.target.closest ? ev.target.closest(".filter-pill") : null;
        if (pill && bar.contains(pill)) self.onPillClick(pill);
      });
    });

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
      this.sortControl.addEventListener("click", function () {
        self.onSortToggle();
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
            self.state.facets[self.state.kind] = new Set();
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
    this.syncKindState();
    this.syncPillPressedState();
    this.syncToggleState();
    this.syncSortState();
    this.apply();
    if (this.catalogRoot && this.catalogRoot.classList) {
      this.catalogRoot.classList.add("catalog-ready");
    }
    return this;
  };

  function initDom(rootEl) {
    var host = rootEl || (root.document ? root.document : null);
    if (!host) return null;
    if (host.querySelector && !host.querySelector('[data-catalog-root][data-page="libraries"]')) {
      return null;
    }
    var scope = host.querySelector('[data-catalog-root][data-page="libraries"]') || host;
    return new Controller(scope).init();
  }

  api.initDom = initDom;
  api.Controller = Controller;

  if (root.document && root.document.addEventListener) {
    root.document.addEventListener("DOMContentLoaded", function () {
      setScriptingFlag(root.document);
      if (root.document.querySelector('[data-catalog-root][data-page="libraries"]')) {
        initDom(root.document);
      }
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
