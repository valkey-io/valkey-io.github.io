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

    try {
        await navigator.clipboard.writeText(source.textContent.trim());
    } catch (error) {
        return;
    }

    button.classList.add('copied');
    setTimeout(function() {
        button.classList.remove('copied');
    }, 2000);
});
