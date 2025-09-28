// Mobile Utilities - Tourism Safety Tracker
// Handles mobile-specific interactions, haptic feedback, and touch gestures

class MobileUtils {
    constructor() {
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.isMobile = window.innerWidth <= 768;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.supportsHaptic = 'vibrate' in navigator;
        this.supportsServiceWorker = 'serviceWorker' in navigator;
        
        // Touch gesture tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        
        // Pull to refresh
        this.pullToRefreshThreshold = 80;
        this.isPulling = false;
        this.pullDistance = 0;
        
        this.init();
    }

    init() {
        this.setupTouchOptimizations();
        this.setupHapticFeedback();
        this.setupSwipeGestures();
        this.setupPullToRefresh();
        this.setupViewportOptimizations();
        this.setupKeyboardHandling();
        this.setupOrientationHandling();
    }

    // Setup touch optimizations
    setupTouchOptimizations() {
        if (!this.isTouch) return;

        // Add touch class to body
        document.body.classList.add('touch-device');
        
        // Optimize touch targets
        this.optimizeTouchTargets();
        
        // Add touch feedback to interactive elements
        this.addTouchFeedback();
        
        // Prevent double-tap zoom on buttons
        this.preventDoubleTabZoom();
    }

    // Optimize touch targets for better accessibility
    optimizeTouchTargets() {
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
        
        interactiveElements.forEach(element => {
            element.classList.add('touch-optimized');
            
            // Ensure minimum touch target size
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.style.minWidth = '44px';
                element.style.minHeight = '44px';
                element.style.display = 'inline-flex';
                element.style.alignItems = 'center';
                element.style.justifyContent = 'center';
            }
        });
    }

    // Add visual touch feedback
    addTouchFeedback() {
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('button, .btn, .nav-btn, .card, .trip-card, .alert-item');
            if (target) {
                target.classList.add('touching');
                this.triggerHapticFeedback('light');
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const target = e.target.closest('button, .btn, .nav-btn, .card, .trip-card, .alert-item');
            if (target) {
                setTimeout(() => target.classList.remove('touching'), 150);
            }
        }, { passive: true });

        document.addEventListener('touchcancel', (e) => {
            const target = e.target.closest('button, .btn, .nav-btn, .card, .trip-card, .alert-item');
            if (target) {
                target.classList.remove('touching');
            }
        }, { passive: true });
    }

    // Prevent double-tap zoom on buttons
    preventDoubleTabZoom() {
        let lastTouchEnd = 0;
        
        document.addEventListener('touchend', (e) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                const target = e.target.closest('button, .btn, input[type="submit"], input[type="button"]');
                if (target) {
                    e.preventDefault();
                }
            }
            lastTouchEnd = now;
        }, false);
    }

    // Setup haptic feedback
    setupHapticFeedback() {
        if (!this.supportsHaptic) return;

        // Add haptic feedback to important actions
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.classList.contains('btn-primary') || target.classList.contains('btn-success')) {
                this.triggerHapticFeedback('medium');
            } else if (target.classList.contains('btn-danger') || target.classList.contains('respond-help')) {
                this.triggerHapticFeedback('heavy');
            } else if (target.classList.contains('btn') || target.classList.contains('nav-btn')) {
                this.triggerHapticFeedback('light');
            }
        });

        // Emergency alert haptic feedback
        document.addEventListener('emergency-alert', () => {
            this.triggerHapticFeedback('heavy');
            // Additional strong vibration pattern for emergencies
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        });
    }

    // Trigger haptic feedback
    triggerHapticFeedback(intensity = 'light') {
        if (!this.supportsHaptic) {
            // Fallback to visual feedback
            this.triggerVisualFeedback(intensity);
            return;
        }

        const patterns = {
            light: [10],
            medium: [20],
            heavy: [50],
            success: [10, 50, 10],
            error: [100, 50, 100, 50, 100]
        };

        const pattern = patterns[intensity] || patterns.light;
        navigator.vibrate(pattern);
        
        // Also trigger visual feedback
        this.triggerVisualFeedback(intensity);
    }

    // Visual feedback fallback
    triggerVisualFeedback(intensity) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('btn')) {
            activeElement.classList.add(`haptic-${intensity}`);
            setTimeout(() => {
                activeElement.classList.remove(`haptic-${intensity}`);
            }, 200);
        }
    }

    // Setup swipe gestures
    setupSwipeGestures() {
        if (!this.isTouch) return;

        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipeGesture(e);
        }, { passive: true });
    }

    // Handle swipe gestures
    handleSwipeGesture(e) {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Only process if swipe is long enough and primarily horizontal
        if (absDeltaX < this.minSwipeDistance || absDeltaY > absDeltaX) return;

        const target = e.target.closest('.swipeable, .trip-card, .alert-item');
        if (!target) return;

        if (deltaX > 0) {
            // Swipe right
            this.handleSwipeRight(target);
        } else {
            // Swipe left
            this.handleSwipeLeft(target);
        }
    }

    // Handle swipe right (usually for "back" or "dismiss")
    handleSwipeRight(element) {
        if (element.classList.contains('modal')) {
            this.closeModal(element);
        } else if (element.classList.contains('alert-item')) {
            this.dismissAlert(element);
        }
        
        this.triggerHapticFeedback('light');
    }

    // Handle swipe left (usually for "actions" or "delete")
    handleSwipeLeft(element) {
        if (element.classList.contains('trip-card') || element.classList.contains('alert-item')) {
            this.showSwipeActions(element);
        }
        
        this.triggerHapticFeedback('light');
    }

    // Show swipe actions
    showSwipeActions(element) {
        element.classList.add('swiped');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            element.classList.remove('swiped');
        }, 3000);
    }

    // Setup pull-to-refresh
    setupPullToRefresh() {
        if (!this.isTouch) return;

        let startY = 0;
        let currentY = 0;
        let pullToRefreshElement = null;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                this.createPullToRefreshIndicator();
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && startY > 0) {
                currentY = e.touches[0].clientY;
                this.pullDistance = Math.max(0, currentY - startY);
                
                if (this.pullDistance > 10) {
                    this.updatePullToRefreshIndicator();
                    this.isPulling = true;
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (this.isPulling && this.pullDistance > this.pullToRefreshThreshold) {
                this.triggerPullToRefresh();
            }
            
            this.resetPullToRefresh();
        }, { passive: true });
    }

    // Create pull-to-refresh indicator
    createPullToRefreshIndicator() {
        if (document.querySelector('.pull-to-refresh')) return;

        const indicator = document.createElement('div');
        indicator.className = 'pull-to-refresh';
        indicator.innerHTML = '↓';
        document.body.appendChild(indicator);
    }

    // Update pull-to-refresh indicator
    updatePullToRefreshIndicator() {
        const indicator = document.querySelector('.pull-to-refresh');
        if (!indicator) return;

        const progress = Math.min(this.pullDistance / this.pullToRefreshThreshold, 1);
        indicator.style.opacity = progress;
        indicator.style.transform = `translateX(-50%) translateY(${this.pullDistance * 0.5}px) rotate(${progress * 180}deg)`;
        
        if (progress >= 1) {
            indicator.classList.add('visible');
            indicator.innerHTML = '↻';
        }
    }

    // Trigger pull-to-refresh
    triggerPullToRefresh() {
        const indicator = document.querySelector('.pull-to-refresh');
        if (indicator) {
            indicator.classList.add('loading');
            indicator.innerHTML = '↻';
        }

        this.triggerHapticFeedback('medium');

        // Dispatch custom event for components to handle
        const refreshEvent = new CustomEvent('pull-to-refresh', {
            detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(refreshEvent);

        // Auto-hide after 2 seconds
        setTimeout(() => {
            this.resetPullToRefresh();
        }, 2000);
    }

    // Reset pull-to-refresh state
    resetPullToRefresh() {
        const indicator = document.querySelector('.pull-to-refresh');
        if (indicator) {
            indicator.remove();
        }
        
        this.isPulling = false;
        this.pullDistance = 0;
    }

    // Setup viewport optimizations
    setupViewportOptimizations() {
        // Prevent zoom on input focus (iOS)
        if (this.isIOS) {
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
                    input.style.fontSize = '16px';
                }
            });
        }

        // Handle viewport height changes (mobile keyboard)
        this.setupViewportHeightHandling();
    }

    // Handle viewport height changes
    setupViewportHeightHandling() {
        let initialViewportHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            // Keyboard is likely open if height decreased significantly
            if (heightDifference > 150) {
                document.body.classList.add('keyboard-open');
                this.adjustForKeyboard(heightDifference);
            } else {
                document.body.classList.remove('keyboard-open');
                this.resetKeyboardAdjustments();
            }
        });
    }

    // Adjust layout for keyboard
    adjustForKeyboard(keyboardHeight) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            // Scroll active input into view
            setTimeout(() => {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }

        // Adjust modal positioning
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.style.paddingBottom = `${keyboardHeight}px`;
        });
    }

    // Reset keyboard adjustments
    resetKeyboardAdjustments() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.paddingBottom = '';
        });
    }

    // Setup keyboard handling
    setupKeyboardHandling() {
        // Handle Enter key on mobile
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.isMobile) {
                const target = e.target;
                
                // Auto-submit forms on Enter in last input
                if (target.tagName === 'INPUT' && target.type !== 'textarea') {
                    const form = target.closest('form');
                    if (form) {
                        const inputs = form.querySelectorAll('input:not([type="hidden"])');
                        const lastInput = inputs[inputs.length - 1];
                        if (target === lastInput) {
                            e.preventDefault();
                            form.dispatchEvent(new Event('submit'));
                        }
                    }
                }
            }
        });
    }

    // Setup orientation handling
    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(() => {
                this.handleOrientationChange();
            }, 500);
        });
    }

    // Handle orientation changes
    handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            document.body.classList.add('landscape');
            document.body.classList.remove('portrait');
        } else {
            document.body.classList.add('portrait');
            document.body.classList.remove('landscape');
        }

        // Adjust emergency modal for landscape
        const emergencyModal = document.querySelector('.emergency-modal');
        if (emergencyModal && emergencyModal.style.display !== 'none') {
            this.adjustEmergencyModalForOrientation(isLandscape);
        }

        // Trigger resize event for components
        window.dispatchEvent(new Event('resize'));
    }

    // Adjust emergency modal for orientation
    adjustEmergencyModalForOrientation(isLandscape) {
        const modal = document.querySelector('.emergency-modal .modal-content');
        if (!modal) return;

        if (isLandscape) {
            modal.style.maxHeight = 'calc(100vh - 20px)';
            modal.style.margin = '10px';
        } else {
            modal.style.maxHeight = 'calc(100vh - 40px)';
            modal.style.margin = '20px';
        }
    }

    // Utility methods
    closeModal(modal) {
        const closeButton = modal.querySelector('.modal-close, .btn-secondary');
        if (closeButton) {
            closeButton.click();
        }
    }

    dismissAlert(alertElement) {
        alertElement.style.transform = 'translateX(100%)';
        alertElement.style.opacity = '0';
        
        setTimeout(() => {
            alertElement.remove();
        }, 300);
    }

    // Check if device supports specific features
    supportsFeature(feature) {
        const features = {
            touch: this.isTouch,
            haptic: this.supportsHaptic,
            serviceWorker: this.supportsServiceWorker,
            geolocation: 'geolocation' in navigator,
            camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
            notifications: 'Notification' in window,
            fullscreen: 'requestFullscreen' in document.documentElement
        };

        return features[feature] || false;
    }

    // Get device info
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTouch: this.isTouch,
            isIOS: this.isIOS,
            isAndroid: this.isAndroid,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        };
    }

    // Performance optimization for mobile
    optimizeForMobile() {
        // Reduce animations on low-end devices
        if (this.isLowEndDevice()) {
            document.body.classList.add('reduced-animations');
        }

        // Optimize images for mobile
        this.optimizeImages();

        // Lazy load non-critical content
        this.setupLazyLoading();
    }

    // Detect low-end devices
    isLowEndDevice() {
        // Simple heuristic based on available features and performance
        const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
        const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores
        
        return memory <= 2 || cores <= 2;
    }

    // Optimize images for mobile
    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Add loading="lazy" if not already present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Set appropriate sizes for responsive images
            if (!img.hasAttribute('sizes') && img.hasAttribute('srcset')) {
                img.setAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
            }
        });
    }

    // Setup lazy loading for content
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyElements = document.querySelectorAll('[data-lazy]');
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        element.classList.add('lazy-loaded');
                        lazyObserver.unobserve(element);
                    }
                });
            });

            lazyElements.forEach(element => {
                lazyObserver.observe(element);
            });
        }
    }
}

// Export for use in other modules
export default MobileUtils;

// Auto-initialize if not imported as module
if (typeof module === 'undefined') {
    window.mobileUtils = new MobileUtils();
}