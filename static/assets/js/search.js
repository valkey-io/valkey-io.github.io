// Site search, including results from the other Valkey sites.

// Favour exact word matches and longer pages over short pages with similar words.
// Values based on git-scm.com's Pagefind setup.
const RANKING = { pageLength: 0.1, termFrequency: 0.1, termSaturation: 2, termSimilarity: 9 };

// Other sites that don't answer within this are left out.
const LOAD_TIMEOUT_MS = 3000;

// Listed first in the site filter. Set once the list of sites loads.
let thisSiteLabel = null;

document.addEventListener('DOMContentLoaded', function() {
    const slot = document.getElementById('site-search');
    // Without a search index, such as under zola serve, there is no search button.
    if (!window.PagefindComponents || !slot) return;

    // Configure before creating the elements: the first element to connect creates the
    // instance with default settings, and configuration after that is ignored.
    window.PagefindComponents.configureInstance('default', {
        ranking: RANKING,
    });

    const trigger = document.createElement('pagefind-modal-trigger');
    trigger.setAttribute('compact', '');
    slot.append(trigger);
    createModal();

    // Only fetch the other sites' indexes once the visitor uses search.
    let isMergeStarted = false;
    document.addEventListener('focusin', function(event) {
        if (isMergeStarted || !event.target.closest('pagefind-modal')) return;
        isMergeStarted = true;
        mergeOtherSites().catch(function(error) {
            console.warn('Search: merging the other sites failed', error);
        });
    });
});

// Pagefind's default modal, plus the site filter and each result's site.
function createModal() {
    const modal = document.createElement('pagefind-modal');
    // The modal goes on <body>, inside the nav it would be hidden while the mobile menu is closed.
    document.body.append(modal);

    modal.querySelector('pagefind-summary').before(createSiteFilter());

    labelResultsWithTheirSite(modal.querySelector('pagefind-results'));
}

// A pill per site, plus "All sites", with one picked at a time.
function createSiteFilter() {
    const instance = window.PagefindComponents.getInstanceManager().getInstance('default');
    const bar = document.createElement('div');
    bar.className = 'search-site-filter';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Filter by site');
    bar.hidden = true;

    const ALL_SITES = '';
    const pills = {};
    let pickedSite = ALL_SITES;
    let counts = {};

    function createPill(site, name) {
        const count = document.createElement('span');
        count.className = 'search-site-filter-count';
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.append(name, count);
        pill.addEventListener('click', function() {
            pickedSite = site;
            instance.triggerFilter('site', site === ALL_SITES ? [] : [site]);
            draw();
        });
        return pill;
    }

    // Updated in place, so a focused pill keeps focus when the counts change.
    function draw() {
        const sites = Object.keys(counts).sort(function(a, b) {
            const thisSiteFirst = (b === thisSiteLabel) - (a === thisSiteLabel);
            return thisSiteFirst || a.localeCompare(b);
        });
        bar.hidden = sites.length < 2 || !instance.searchTerm.trim();

        const shown = [ALL_SITES].concat(sites);
        for (const site of shown) {
            pills[site] = pills[site] || createPill(site, site === ALL_SITES ? 'All sites' : site);
        }
        const isOrderChanged = shown.some(function(site, i) { return bar.children[i] !== pills[site]; });
        if (isOrderChanged) bar.replaceChildren(...shown.map(function(site) { return pills[site]; }));

        const total = sites.reduce(function(sum, site) { return sum + counts[site]; }, 0);
        for (const site of shown) {
            pills[site].setAttribute('aria-pressed', String(site === pickedSite));
            pills[site].lastChild.textContent = String(site === ALL_SITES ? total : counts[site]);
        }
    }

    // `total` ignores the picked site, so the other sites keep their counts.
    instance.on('filters', function(filters) {
        counts = (filters.total && filters.total.site) || {};
        draw();
    });
    instance.on('search', draw);
    return bar;
}

// Adds the site's name to each result as Pagefind renders it, which happens as results scroll into
// view.
function labelResultsWithTheirSite(results) {
    const instance = window.PagefindComponents.getInstanceManager().getInstance('default');
    new MutationObserver(function() {
        // Placeholders carry the index too, before Pagefind replaces them with the result.
        const rendered = results.querySelectorAll('[data-pf-result-index]:not([aria-hidden="true"]):not([data-site-labelled])');
        for (const result of rendered) {
            result.setAttribute('data-site-labelled', '');
            const rawResult = instance.searchResult.results[result.getAttribute('data-pf-result-index')];
            if (!rawResult) continue;
            rawResult.data().then(function(data) {
                if (!data.meta.site || !result.isConnected) return;
                const label = document.createElement('p');
                label.className = 'search-result-site';
                label.textContent = 'Site: ' + data.meta.site;
                result.querySelector('.pf-result-content').append(label);
            }).catch(function(error) {
                console.warn('Search: labelling a result failed', error);
            });
        }
    }).observe(results, { childList: true, subtree: true });
}

// Merging an index that doesn't load breaks every search (Pagefind issue #887), so each is checked
// first. Returns its Pagefind minor version, or null.
async function probeIndexVersion(bundlePath) {
    try {
        const signal = AbortSignal.timeout(LOAD_TIMEOUT_MS);
        // Skips caches, as Pagefind does, so this checks the same deploy Pagefind will load.
        const entry = await (await fetch(bundlePath + 'pagefind-entry.json?ts=' + Date.now(), { signal })).json();
        const language = Object.values(entry.languages)[0];
        const meta = await fetch(bundlePath + 'pagefind.' + language.hash + '.pf_meta', { signal });
        return meta.ok ? entry.version.split('.').slice(0, 2).join('.') : null;
    } catch {
        return null;
    }
}

async function mergeOtherSites() {
    const instance = window.PagefindComponents.getInstanceManager().getInstance('default');
    await instance.triggerLoad();
    const [ownVersion, sites] = await Promise.all([
        probeIndexVersion('/pagefind/'),
        fetch('/cross-site-search.json').then(function(response) { return response.json(); }),
    ]);
    if (!ownVersion) {
        console.warn("Search: this site's index didn't load, so not merging the other sites");
        return;
    }
    thisSiteLabel = sites.label;

    await Promise.all(sites.otherSites.map(async function(index) {
        // Pagefind only merges indexes built with its own minor version, so each site publishes a
        // copy of its index for each version.
        const bundle = index + 'v' + ownVersion + '/';
        if ((await probeIndexVersion(bundle)) !== ownVersion) {
            console.warn('Search: leaving out ' + index + ', which has no copy for Pagefind ' + ownVersion + " or didn't load in time");
            return;
        }
        // The Component UI has no public way to merge an index after it loads, so this uses its
        // private Pagefind instance. Merged indexes don't inherit the instance's ranking.
        await instance.__pagefind__.mergeIndex(bundle, { ranking: RANKING, indexWeight: sites.otherSitesIndexWeight });
        // Without this, the site filter leaves this site out until the search box is cleared.
        await instance.__pagefind__.filters();
        // Pagefind doesn't redo a search that finished before this merge.
        instance.triggerSearch(instance.searchTerm);
    }));
}
