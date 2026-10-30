document.addEventListener('DOMContentLoaded', function() {
    const slot = document.getElementById('site-search');
    // Without a search index, such as under zola serve, there is no search button.
    if (!window.PagefindComponents || !slot) return;

    // Configure before creating the elements: the first element to connect creates the
    // instance with default settings, and configuration after that is ignored.
    window.PagefindComponents.configureInstance('default', {
        // Favour exact word matches and longer pages over short pages with similar words.
        // Values based on git-scm.com's Pagefind setup.
        ranking: { pageLength: 0.1, termFrequency: 0.1, termSaturation: 2, termSimilarity: 9 },
    });

    const trigger = document.createElement('pagefind-modal-trigger');
    trigger.setAttribute('compact', '');
    slot.append(trigger);
    // The modal goes on <body>, inside the nav it would be hidden while the mobile menu is closed.
    document.body.append(document.createElement('pagefind-modal'));
});
