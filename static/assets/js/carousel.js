/**
 * Homepage Participant Carousel Module
 * 
 * Features:
 * - Auto-scrolling carousel with pause on hover
 * - Responsive design (1/2/3 cards per slide based on screen size)
 * - Keyboard navigation support
 * - Intersection Observer for performance optimization
 * - Accessibility features with ARIA labels
 * 
 */

(function() {
    'use strict';
    
    // Cache DOM elements to avoid repeated queries
    let carousel, track, dots, cards;
    let currentSlide = 0;
    let autoScrollInterval = null;
    let dotButtons = [];
    let isVisible = true;
    let resizeTimeout;
    
    /**
     * Get number of cards per slide based on screen size
     * @returns {number} Number of cards to show per slide
     */
    function getCardsPerSlide() {
        const width = window.innerWidth;
        if (width <= 768) {
            return 1; // Mobile: 1 card per slide
        } else if (width <= 1200) {
            return 2; // Tablet: 2 cards per slide
        } else {
            return 3; // Desktop: 3 cards per slide
        }
    }
    
    /**
     * Update dots based on current screen size
     */
    function updateDotsForScreenSize() {
        const cardsPerSlide = getCardsPerSlide();
        const totalSlides = Math.ceil(cards.length / cardsPerSlide);
        
        // Clear existing dots
        dots.innerHTML = '';
        
        // Create new dots
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'homepage-participant-dot';
            dot.setAttribute('data-slide', i);
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.setAttribute('aria-current', 'false');
            
            dot.addEventListener('click', () => {
                goToSlide(i);
            });
            
            dots.appendChild(dot);
        }
        
        // Update reference to dot buttons
        dotButtons = dots.querySelectorAll('.homepage-participant-dot');
        
        // Ensure current slide is valid
        if (currentSlide >= totalSlides) {
            currentSlide = totalSlides - 1;
        }
        
        updateDots();
    }
    
    /**
     * Start auto-scroll functionality
     */
    function startAutoScroll() {
        if (dotButtons.length <= 1 || !isVisible) return; // Don't auto-scroll if only one slide or not visible
        
        autoScrollInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % dotButtons.length;
            updateCarousel();
        }, 5000); // 5 seconds
    }
    
    /**
     * Update carousel position
     */
    function updateCarousel() {
        const slideWidth = carousel.offsetWidth;
        const translateX = -currentSlide * slideWidth;
        track.style.transform = `translateX(${translateX}px)`;
        updateDots();
    }
    
    /**
     * Update dot states
     */
    function updateDots() {
        dotButtons.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.setAttribute('aria-current', 'true');
                dot.classList.add('active');
            } else {
                dot.setAttribute('aria-current', 'false');
                dot.classList.remove('active');
            }
        });
    }
    
    /**
     * Go to specific slide
     * @param {number} slideIndex - Index of slide to navigate to
     */
    function goToSlide(slideIndex) {
        currentSlide = Math.max(0, Math.min(slideIndex, dotButtons.length - 1));
        updateCarousel();
    }
    
    /**
     * Add keyboard support for participant cards
     */
    function setupKeyboardSupport() {
        cards.forEach(card => {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Pause auto-scroll on hover
        carousel.addEventListener('mouseenter', () => {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
        });
        
        carousel.addEventListener('mouseleave', () => {
            startAutoScroll();
        });
        
        // Handle window resize with debouncing
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateDotsForScreenSize();
                updateCarousel();
            }, 250);
        });
        
        // Add Intersection Observer to pause carousel when not visible
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isVisible = entry.isIntersecting;
                    if (isVisible) {
                        startAutoScroll();
                    } else if (autoScrollInterval) {
                        clearInterval(autoScrollInterval);
                        autoScrollInterval = null;
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(carousel);
        }
    }
    
    /**
     * Initialize the carousel
     */
    function init() {
        carousel = document.getElementById('homepageParticipantsCarousel');
        track = document.getElementById('homepageParticipantsTrack');
        dots = document.getElementById('homepageParticipantsDots');
        
        if (!carousel || !track || !dots) {
            console.warn('Participant carousel elements not found');
            return;
        }
        
        cards = track.querySelectorAll('.homepage-participant-card');
        
        if (cards.length === 0) {
            console.warn('No participant cards found');
            return;
        }
        
        // Setup carousel functionality
        updateDotsForScreenSize();
        setupKeyboardSupport();
        setupEventListeners();
        startAutoScroll();
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
