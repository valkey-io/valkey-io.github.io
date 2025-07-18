// Global function for toggling header menu
window.toggleHeaderMenu = function() {
    const nav = document.querySelector('.header nav');
    if (nav) {
        nav.classList.toggle('active');
    }
};

// Fetch and display GitHub stars count
async function fetchGitHubStars() {
    try {
        const response = await fetch('https://api.github.com/repos/valkey-io/valkey');
        if (response.ok) {
            const data = await response.json();
            const starCount = data.stargazers_count;
            
            // Find the GitHub button and add star count
            const githubButton = document.querySelector('.github-button');
            if (githubButton) {
                // Create star count element if it doesn't exist
                let starCountElement = githubButton.querySelector('.star-count');
                if (!starCountElement) {
                    starCountElement = document.createElement('span');
                    starCountElement.className = 'star-count';
                    starCountElement.style.cssText = `
                        background: #f1f5f9;
                        color: #64748b;
                        font-size: 12px;
                        padding: 2px 6px;
                        border-radius: 10px;
                        margin-left: 6px;
                        font-weight: 500;
                        white-space: nowrap;
                    `;
                    githubButton.appendChild(starCountElement);
                }
                
                // Format the number with K for thousands
                const formattedCount = starCount >=100? (starCount / 1000).toFixed(1) + 'k' : starCount.toString();
                starCountElement.textContent = `${formattedCount} ★`;
            }
        }
    } catch (error) {
        console.log('Could not fetch GitHub stars:', error);
    }
}

// Set active menu item based on current URL
function setActiveMenuItem() {
    const nav = document.querySelector('.header nav');
    if (!nav) return;

    const currentPath = window.location.pathname;
    const menuItems = nav.querySelectorAll('a[role="menuitem"]');

    menuItems.forEach(item => {
        const itemPath = item.getAttribute('href');
        // Remove trailing slash for comparison
        const normalizedItemPath = itemPath.replace(/\/$/, '');
        const normalizedCurrentPath = currentPath.replace(/\/$/, '');
        
        // Check if current path starts with the menu item path
        if (normalizedCurrentPath.startsWith(normalizedItemPath) && normalizedItemPath !== '') {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setActiveMenuItem();
    fetchGitHubStars();
});

// Class detection function that checks if an element with a given class name exists
// This provides backwards compatibility for older browsers (IE6-8) that don't support getElementsByClassName
// Used by the navigation menu to detect presence of certain UI elements
function hasClass(className) {
    if (!document.getElementsByClassName) { //class name function in old IE
        document.getElementsByClassName = function(search) {
            var d = document, elements, pattern, i, results = [];
            if (d.querySelectorAll) { // IE8
                return d.querySelectorAll("." + search);
            }
            if (d.evaluate) { // IE6, IE7
                pattern = ".//*[contains(concat(' ', @class, ' '), ' " + search + " ')]";
                elements = d.evaluate(pattern, d, null, 0, null);
                while ((i = elements.iterateNext())) {
                    results.push(i);
                }
            } else {
                elements = d.getElementsByTagName("*");
                pattern = new RegExp("(^|\\s)" + search + "(\\s|$)");
                for (i = 0; i < elements.length; i++) {
                    if ( pattern.test(elements[i].className) ) {
                        results.push(elements[i]);
                    }
                }
            }
            return results;
        };
    }
    return !!document.getElementsByClassName(className).length; //return a boolean
}
