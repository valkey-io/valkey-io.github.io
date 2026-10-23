// Copy-to-clipboard for .copy-code blocks. Delegated, so blocks can appear
// anywhere on the page without extra wiring.
document.addEventListener('click', async function(event) {
    const button = event.target.closest('.copy-code-button');
    if (!button) {
        return;
    }

    const block = button.closest('.copy-code');
    const source = block && block.querySelector('code');
    if (!source) {
        return;
    }

    // The icon swap is invisible to screen readers, so the result is also
    // announced through the block's status region.
    const status = block.querySelector('.copy-code-status');

    try {
        await navigator.clipboard.writeText(source.textContent.trim());
        button.classList.add('copied');
        status.textContent = 'Copied to clipboard';
    } catch (error) {
        status.textContent = 'Copy failed';
    }

    setTimeout(function() {
        button.classList.remove('copied');
        status.textContent = '';
    }, 2000);
});
