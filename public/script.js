// Import Firebase services
import { contentService } from './js/firebase-content.js';

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load dynamic content from Firebase
    loadDynamicContent();
    
    // Initialize animated text
    initAnimatedText();
    
    // Initialize hero background
    initHeroBackground();
    
    // Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.program-card, .testimonial-card, .stat-item');
    animateElements.forEach(el => observer.observe(el));

    // Form validation (if forms are added later)
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Newsletter signup (placeholder functionality)
    const newsletterForm = document.querySelector('#newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            if (validateEmail(email)) {
                // Show success message
                showNotification('Thank you for subscribing!', 'success');
                this.reset();
            } else {
                showNotification('Please enter a valid email address.', 'error');
            }
        });
    }

    // Contact form handling (placeholder functionality)
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            if (name && validateEmail(email) && message) {
                // Simulate form submission
                showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
                this.reset();
            } else {
                showNotification('Please fill in all required fields correctly.', 'error');
            }
        });
    }

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#1e3a8a'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

        // Add close button styles
        const closeButton = notification.querySelector('.notification-close');
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Close functionality
        closeButton.addEventListener('click', () => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Lazy loading for images (when images are added)
    const lazyImages = document.querySelectorAll('img[data-src]');
    if (lazyImages.length > 0) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            hero.style.transform = `translateY(${parallax}px)`;
        });
    }

    // Count-up animation for statistics
    function animateCounter(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = current.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Animate counters when they come into view
    const counters = document.querySelectorAll('.stat h3');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const text = counter.textContent;
                const number = parseInt(text.replace(/[^\d]/g, ''));
                if (number) {
                    counter.textContent = '0';
                    animateCounter(counter, 0, number, 2000);
                    counterObserver.unobserve(counter);
                }
            }
        });
    });

    counters.forEach(counter => counterObserver.observe(counter));

    // Keyboard navigation for dropdowns
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.nav-link');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (trigger && content) {
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    content.style.opacity = content.style.opacity === '1' ? '0' : '1';
                    content.style.visibility = content.style.visibility === 'visible' ? 'hidden' : 'visible';
                }
                
                if (e.key === 'Escape') {
                    content.style.opacity = '0';
                    content.style.visibility = 'hidden';
                }
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                const content = dropdown.querySelector('.dropdown-content');
                if (content) {
                    content.style.opacity = '0';
                    content.style.visibility = 'hidden';
                }
            }
        });
    });

    // Performance optimization: Debounce scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Apply debounce to scroll events
    const debouncedScrollHandler = debounce(() => {
        // Additional scroll handling can go here
    }, 16); // ~60fps

    window.addEventListener('scroll', debouncedScrollHandler);

    // Accessibility: Skip to main content
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #1e3a8a;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main content id for skip link
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.id = 'main-content';
    }

    console.log('Compassion Course website initialized successfully!');
});

// Load dynamic content from Firebase
async function loadDynamicContent() {
    try {
        console.log('Loading dynamic content from Firebase...');
        
        // Get all published content
        const result = await contentService.getPublishedContent();
        
        if (result.success) {
            const content = contentService.groupContentBySection(result.content);
            
            // Update hero section
            updateHeroContent(content.hero || []);
            
            // Update about section  
            updateAboutContent(content.about || []);
            
            // Update statistics
            updateStatistics(content.statistics || []);
            
            // Update other sections as needed
            updateProgramsContent(content.programs || []);
            updateTestimonialsContent(content.testimonials || []);
            updateCTAContent(content.cta || []);
            
            console.log('✅ Dynamic content loaded successfully');
        } else {
            console.error('Failed to load content:', result.error);
            // Fallback to static content (already in HTML)
        }
    } catch (error) {
        console.error('Error loading dynamic content:', error);
        // Fallback to static content (already in HTML)
    }
}

// Update hero section content
function updateHeroContent(heroContent) {
    heroContent.forEach(item => {
        switch (item.key) {
            case 'hero-title':
                updateElement('.hero-title', item.content);
                break;
            case 'hero-subtitle':
                updateElement('.hero-subtitle', item.content);
                break;
            case 'hero-description':
                updateElement('.hero-description', item.content);
                break;
        }
    });
}

// Update about section content
function updateAboutContent(aboutContent) {
    aboutContent.forEach(item => {
        switch (item.key) {
            case 'about-title':
                updateElement('.about-text h2', item.content);
                break;
            case 'about-description':
                updateElement('.about-text p', item.content);
                break;
        }
    });
}

// Update statistics
function updateStatistics(statsContent) {
    statsContent.forEach(item => {
        switch (item.key) {
            case 'stats-participants':
                updateElement('.stat h3', item.content, 0); // First stat
                break;
            case 'stats-countries':
                updateElement('.stat h3', item.content, 1); // Second stat
                break;
        }
    });
}

// Update programs section
function updateProgramsContent(programsContent) {
    programsContent.forEach(item => {
        switch (item.key) {
            case 'programs-title':
                updateElement('#programs .section-title', item.content);
                break;
            case 'programs-description':
                updateElement('#programs .section-description', item.content);
                break;
        }
    });
}

// Update testimonials section
function updateTestimonialsContent(testimonialsContent) {
    testimonialsContent.forEach(item => {
        switch (item.key) {
            case 'testimonials-title':
                updateElement('#testimonials .section-title', item.content);
                break;
        }
    });
}

// Update CTA section
function updateCTAContent(ctaContent) {
    ctaContent.forEach(item => {
        switch (item.key) {
            case 'cta-title':
                updateElement('.cta h2', item.content);
                break;
            case 'cta-description':
                updateElement('.cta p', item.content);
                break;
        }
    });
}

// Helper function to update DOM elements
function updateElement(selector, content, index = null) {
    const elements = document.querySelectorAll(selector);
    
    if (elements.length > 0) {
        const element = index !== null ? elements[index] : elements[0];
        if (element) {
            element.textContent = content;
        }
    }
}

// Subscribe to real-time content updates
function subscribeToContentUpdates() {
    return contentService.subscribeToContent(null, (content) => {
        console.log('🔥 Real-time content update received');
        const groupedContent = contentService.groupContentBySection(content);
        
        // Update all sections
        updateHeroContent(groupedContent.hero || []);
        updateAboutContent(groupedContent.about || []);
        updateStatistics(groupedContent.statistics || []);
        updateProgramsContent(groupedContent.programs || []);
        updateTestimonialsContent(groupedContent.testimonials || []);
        updateCTAContent(groupedContent.cta || []);
    });
}

// Start real-time updates after initial load
setTimeout(() => {
    subscribeToContentUpdates();
}, 2000);

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart + 'ms');
        }, 0);
    });
}

// Animated text functionality
function initAnimatedText() {
    const animatedTextElement = document.getElementById('animatedText');
    if (!animatedTextElement) return;
    
    const messages = [
        'Build lasting empathy practices',
        'Be heard and understood',
        'Create meaningful dialogue',
        'Live in alignment with your values',
        'Join a global compassion community'
    ];
    
    let currentIndex = 0;
    
    function updateText() {
        animatedTextElement.textContent = messages[currentIndex];
        currentIndex = (currentIndex + 1) % messages.length;
    }
    
    // Update text every 2 seconds
    setInterval(updateText, 2000);
}

// Hero background functionality
function initHeroBackground() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Test if image loads
    const img = new Image();
    img.onload = function() {
        console.log('Hero background image loaded successfully');
        heroSection.classList.add('with-bg');
    };
    img.onerror = function() {
        console.error('Failed to load hero background image');
        // Keep the gradient background as fallback
    };
    img.src = 'hero-background.jpg';
    
    // Fallback: add class after a delay even if image doesn't load
    setTimeout(() => {
        if (!heroSection.classList.contains('with-bg')) {
            heroSection.classList.add('with-bg');
        }
    }, 2000);
}
