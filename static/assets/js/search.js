document.addEventListener('DOMContentLoaded', function() {
    const slot = document.getElementById('site-search');
    const modalContents = document.getElementById('search-modal-contents');
    // Without a search index, such as under zola serve, there is no search button.
    if (!window.PagefindComponents || !slot || !modalContents) return;

    // Configure before creating the elements: the first element to connect creates the
    // instance with default settings, and configuration after that is ignored.
    window.PagefindComponents.configureInstance('default', {
        // Favour exact word matches and longer pages over short pages with similar words.
        // Values based on git-scm.com's Pagefind setup.
        ranking: { pageLength: 0.1, termFrequency: 0.1, termSaturation: 2, termSimilarity: 9 },
    });
    const instance = window.PagefindComponents.getInstanceManager().getInstance('default');
    addBreadcrumbsToResults(instance);
    putExactTitleMatchesFirst(instance);

    const trigger = document.createElement('pagefind-modal-trigger');
    trigger.setAttribute('compact', '');
    slot.append(trigger);
    // The modal goes on <body>, inside the nav it would be hidden while the mobile menu is closed.
    // The <template> it's built from is never shown, so it can be anywhere.
    document.body.append(createModal(modalContents));
});

// Each page's breadcrumb is a filter rather than metadata, since Pagefind searches metadata and
// breadcrumbs shouldn't change the results. The result template only sees metadata, so this copies
// each result's breadcrumb there when its data loads.
function addBreadcrumbsToResults(instance) {
    instance.on('results', function(searchResult) {
        for (const result of searchResult.results) {
            const loadData = result.data;
            result.data = async function() {
                const data = await loadData();
                data.meta.breadcrumb = data.filters.breadcrumb?.[0];
                return data;
            };
        }
    });
}

// Pages titled exactly what was searched go first, ahead of Pagefind's ranking. Failing that, pages
// titled its plural do.
//
// The Component UI has no public hook for changing results, so this wraps the search function of
// its private Pagefind instance, which exists once the instance has loaded.
function putExactTitleMatchesFirst(instance) {
    const load = instance.__load__.bind(instance);
    instance.__load__ = async function() {
        await load();
        const pagefind = instance.__pagefind__;
        if (!pagefind || pagefind.isExactTitleWrapped) return;
        pagefind.isExactTitleWrapped = true;

        const search = pagefind.search.bind(pagefind);
        pagefind.search = async function(typedTerm, options) {
            // Replace hyphens with spaces for hyphenated queries.
            const term = typedTerm?.replace(/-/g, ' ');
            if (!term) return search(typedTerm, options);
            const exactTitle = term.trim().toLowerCase().replace(/\s+/g, ' ');
            // With no term, a search returns every page the filter matches.
            const searchTitles = function(titles) {
                return search(null, { ...options, filters: { ...options.filters, exact_title: titles } });
            };
            const [result, typedMatches] = await Promise.all([search(term, options), searchTitles(exactTitle)]);
            const exactMatches = typedMatches.results.length
                ? typedMatches
                : await searchTitles({ any: [exactTitle + 's', exactTitle + 'es'] });

            // Pages sharing the title all go first, in Pagefind's order.
            const exactIds = new Set(exactMatches.results.map(function(match) { return match.id; }));
            const isExactMatch = function(match) { return exactIds.has(match.id); };
            const others = result.results.filter(function(match) { return !isExactMatch(match); });
            return { ...result, results: result.results.filter(isExactMatch).concat(others) };
        };
    };
}

// The modal's contents are in templates/includes/search-modal.html, in a <template> so the Pagefind
// elements stay inactive until the modal has moved them into its dialog.
function createModal(contents) {
    const modal = document.createElement('pagefind-modal');
    modal.append(contents.content.cloneNode(true));
    return modal;
}
