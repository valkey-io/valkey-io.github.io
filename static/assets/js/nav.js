// Global function for toggling header menu
window.toggleHeaderMenu = function() {
    const nav = document.querySelector('.header nav');
    if (nav) {
        nav.classList.toggle('active');
    }
};

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
