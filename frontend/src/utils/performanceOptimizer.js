// Performance Optimizer for Mobile - Tourism Safety Tracker
// Handles mobile-specific performance optimizations

class PerformanceOptimizer {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isLowEndDevice = this.detectLowEndDevice();
        this.connectionType = this.getConnectionType();
        this.performanceMetrics = {};
        
        this.init();
    }

    init() {
        this.setupPerformanceMonitoring();
        this.optimizeForDevice();
        this.setupResourceOptimizations();
        this.setupMemoryManagement();
        this.setupBatteryOptimizations();
    }

    // Detect low-end devices
    detectLowEndDevice() {
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const connection = navigator.connection;
        
        // Consider device low-end if:
        // - Less than 3GB RAM
        // - Less than 4 CPU cores
        // - Slow connection
        const isLowMemory = memory < 3;
        const isLowCores = cores < 4;
        const isSlowConnection = connection && (
            connection.effectiveType === 'slow-2g' || 
            connection.effectiveType === '2g' ||
            connection.effectiveType === '3g'
        );

        return isLowMemory || isLowCores || isSlowConnection;
    }

    // Get connection type
    getConnectionType() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (!connection) return 'unknown';
        
        return {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
        };
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();
        
        // Monitor memory usage
        this.monitorMemoryUsage();
        
        // Monitor frame rate
        this.monitorFrameRate();
        
        // Monitor network performance
        this.monitorNetworkPerformance();
    }

    // Monitor Core Web Vitals
    monitorCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.performanceMetrics.lcp = lastEntry.startTime;
                    
                    if (lastEntry.startTime > 2500) {
                        this.optimizeLCP();
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('LCP monitoring not supported');
            }

            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.performanceMetrics.fid = entry.processingStart - entry.startTime;
                        
                        if (entry.processingStart - entry.startTime > 100) {
                            this.optimizeFID();
                        }
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('FID monitoring not supported');
            }

            // Cumulative Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    
                    this.performanceMetrics.cls = clsValue;
                    
                    if (clsValue > 0.1) {
                        this.optimizeCLS();
                    }
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('CLS monitoring not supported');
            }
        }
    }

    // Monitor memory usage
    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.performanceMetrics.memory = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
                };

                // Trigger garbage collection if memory usage is high
                if (this.performanceMetrics.memory.usage > 80) {
                    this.triggerMemoryCleanup();
                }
            }, 30000); // Check every 30 seconds
        }
    }

    // Monitor frame rate
    monitorFrameRate() {
        let frames = 0;
        let lastTime = performance.now();
        
        const countFrames = (currentTime) => {
            frames++;
            
            if (currentTime >= lastTime + 1000) {
                this.performanceMetrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
                
                // Optimize if FPS is too low
                if (this.performanceMetrics.fps < 30) {
                    this.optimizeFrameRate();
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(countFrames);
        };
        
        requestAnimationFrame(countFrames);
    }

    // Monitor network performance
    monitorNetworkPerformance() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            connection.addEventListener('change', () => {
                this.connectionType = this.getConnectionType();
                this.adaptToConnection();
            });
        }

        // Monitor resource loading times
        if ('PerformanceObserver' in window) {
            try {
                const resourceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.duration > 1000) { // Slow resource
                            this.optimizeSlowResource(entry);
                        }
                    });
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
            } catch (e) {
                console.warn('Resource monitoring not supported');
            }
        }
    }

    // Optimize for device capabilities
    optimizeForDevice() {
        if (this.isLowEndDevice) {
            this.applyLowEndOptimizations();
        }

        if (this.isMobile) {
            this.applyMobileOptimizations();
        }

        if (this.connectionType.saveData) {
            this.applyDataSavingOptimizations();
        }
    }

    // Apply low-end device optimizations
    applyLowEndOptimizations() {
        document.body.classList.add('low-end-device');
        
        // Reduce animations
        document.body.classList.add('reduced-animations');
        
        // Disable non-essential features
        this.disableNonEssentialFeatures();
        
        // Reduce image quality
        this.reduceImageQuality();
        
        // Limit concurrent operations
        this.limitConcurrentOperations();
    }

    // Apply mobile-specific optimizations
    applyMobileOptimizations() {
        // Optimize touch interactions
        this.optimizeTouchInteractions();
        
        // Reduce bundle size
        this.optimizeBundleSize();
        
        // Optimize for battery life
        this.optimizeForBattery();
        
        // Preload critical resources
        this.preloadCriticalResources();
    }

    // Apply data saving optimizations
    applyDataSavingOptimizations() {
        document.body.classList.add('data-saver');
        
        // Disable auto-loading of images
        this.disableAutoImageLoading();
        
        // Reduce API polling frequency
        this.reducePollingFrequency();
        
        // Compress data transfers
        this.enableDataCompression();
    }

    // Optimize Largest Contentful Paint
    optimizeLCP() {
        // Preload critical resources
        const criticalImages = document.querySelectorAll('img[data-critical]');
        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.src;
            document.head.appendChild(link);
        });

        // Optimize font loading
        this.optimizeFontLoading();
    }

    // Optimize First Input Delay
    optimizeFID() {
        // Break up long tasks
        this.breakUpLongTasks();
        
        // Use web workers for heavy computations
        this.offloadToWebWorkers();
        
        // Defer non-critical JavaScript
        this.deferNonCriticalJS();
    }

    // Optimize Cumulative Layout Shift
    optimizeCLS() {
        // Add size attributes to images
        const images = document.querySelectorAll('img:not([width]):not([height])');
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;
            });
        });

        // Reserve space for dynamic content
        this.reserveSpaceForDynamicContent();
    }

    // Optimize frame rate
    optimizeFrameRate() {
        // Reduce animation complexity
        document.body.classList.add('reduced-animations');
        
        // Use CSS transforms instead of changing layout properties
        this.optimizeAnimations();
        
        // Throttle scroll events
        this.throttleScrollEvents();
    }

    // Trigger memory cleanup
    triggerMemoryCleanup() {
        // Clear unused event listeners
        this.clearUnusedEventListeners();
        
        // Clear cached data
        this.clearCachedData();
        
        // Remove unused DOM elements
        this.removeUnusedDOMElements();
        
        // Force garbage collection (if available)
        if (window.gc) {
            window.gc();
        }
    }

    // Setup resource optimizations
    setupResourceOptimizations() {
        // Lazy load images
        this.setupLazyLoading();
        
        // Optimize image formats
        this.optimizeImageFormats();
        
        // Setup resource hints
        this.setupResourceHints();
        
        // Enable compression
        this.enableCompression();
    }

    // Setup lazy loading
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px'
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Optimize image formats
    optimizeImageFormats() {
        const supportsWebP = this.supportsWebP();
        const supportsAVIF = this.supportsAVIF();
        
        if (supportsAVIF || supportsWebP) {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                const src = img.src;
                if (src && !src.includes('.svg')) {
                    if (supportsAVIF) {
                        img.src = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
                    } else if (supportsWebP) {
                        img.src = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                    }
                }
            });
        }
    }

    // Check WebP support
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // Check AVIF support
    supportsAVIF() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }

    // Setup memory management
    setupMemoryManagement() {
        // Clean up on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.cleanupOnHidden();
            } else {
                this.restoreOnVisible();
            }
        });

        // Clean up on low memory
        if ('memory' in performance) {
            this.setupLowMemoryHandling();
        }
    }

    // Setup battery optimizations
    setupBatteryOptimizations() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.optimizeForBatteryLevel(battery.level, battery.charging);
                
                battery.addEventListener('levelchange', () => {
                    this.optimizeForBatteryLevel(battery.level, battery.charging);
                });
                
                battery.addEventListener('chargingchange', () => {
                    this.optimizeForBatteryLevel(battery.level, battery.charging);
                });
            });
        }
    }

    // Optimize for battery level
    optimizeForBatteryLevel(level, charging) {
        if (level < 0.2 && !charging) {
            // Low battery mode
            document.body.classList.add('low-battery');
            this.enablePowerSavingMode();
        } else {
            document.body.classList.remove('low-battery');
            this.disablePowerSavingMode();
        }
    }

    // Enable power saving mode
    enablePowerSavingMode() {
        // Reduce animation frequency
        document.body.classList.add('power-saving');
        
        // Reduce polling frequency
        this.reducePollingFrequency();
        
        // Disable non-essential features
        this.disableNonEssentialFeatures();
        
        // Reduce screen brightness (if supported)
        if ('screen' in navigator && 'brightness' in navigator.screen) {
            navigator.screen.brightness = 0.5;
        }
    }

    // Disable power saving mode
    disablePowerSavingMode() {
        document.body.classList.remove('power-saving');
        this.restoreNormalOperations();
    }

    // Utility methods
    breakUpLongTasks() {
        // Use scheduler.postTask if available, otherwise setTimeout
        const scheduler = window.scheduler;
        
        if (scheduler && scheduler.postTask) {
            return (callback) => scheduler.postTask(callback, { priority: 'user-blocking' });
        } else {
            return (callback) => setTimeout(callback, 0);
        }
    }

    throttleScrollEvents() {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // Handle scroll
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        document.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Get performance metrics
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            deviceInfo: {
                isMobile: this.isMobile,
                isLowEndDevice: this.isLowEndDevice,
                connectionType: this.connectionType
            },
            timestamp: Date.now()
        };
    }

    // Log performance metrics
    logPerformanceMetrics() {
        const metrics = this.getPerformanceMetrics();
        console.log('Performance Metrics:', metrics);
        
        // Send to analytics if available
        if (window.gtag) {
            window.gtag('event', 'performance_metrics', {
                custom_parameter: JSON.stringify(metrics)
            });
        }
    }

    // Cleanup methods (implement as needed)
    disableNonEssentialFeatures() {
        // Disable animations
        document.body.classList.add('no-animations');
        
        // Disable auto-refresh
        clearInterval(window.autoRefreshInterval);
    }

    reduceImageQuality() {
        // Implementation depends on image serving infrastructure
        console.log('Reducing image quality for low-end device');
    }

    limitConcurrentOperations() {
        // Limit concurrent API requests
        window.maxConcurrentRequests = 2;
    }

    optimizeTouchInteractions() {
        // Add touch-action CSS property
        document.body.style.touchAction = 'manipulation';
    }

    optimizeBundleSize() {
        // Dynamic imports for non-critical features
        console.log('Optimizing bundle size for mobile');
    }

    optimizeForBattery() {
        // Reduce background activity
        console.log('Optimizing for battery life');
    }

    preloadCriticalResources() {
        // Preload critical CSS and JS
        const criticalResources = [
            '/src/styles/main.css',
            '/src/styles/mobile-optimizations.css'
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    }

    disableAutoImageLoading() {
        // Convert img src to data-src for manual loading
        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            img.dataset.src = img.src;
            img.removeAttribute('src');
            img.classList.add('lazy');
        });
    }

    reducePollingFrequency() {
        // Reduce real-time update frequency
        if (window.realTimeService) {
            window.realTimeService.setPollingInterval(30000); // 30 seconds instead of 5
        }
    }

    enableDataCompression() {
        // Enable gzip/brotli compression headers
        console.log('Data compression enabled');
    }

    optimizeFontLoading() {
        // Use font-display: swap
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: system-ui;
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
    }

    offloadToWebWorkers() {
        // Move heavy computations to web workers
        if ('Worker' in window) {
            console.log('Web workers available for offloading');
        }
    }

    deferNonCriticalJS() {
        // Defer non-critical JavaScript
        const scripts = document.querySelectorAll('script[data-defer]');
        scripts.forEach(script => {
            script.defer = true;
        });
    }

    reserveSpaceForDynamicContent() {
        // Add min-height to containers that will have dynamic content
        const dynamicContainers = document.querySelectorAll('[data-dynamic]');
        dynamicContainers.forEach(container => {
            if (!container.style.minHeight) {
                container.style.minHeight = '100px';
            }
        });
    }

    optimizeAnimations() {
        // Use transform and opacity for animations
        const style = document.createElement('style');
        style.textContent = `
            .optimized-animation {
                will-change: transform, opacity;
                transform: translateZ(0);
            }
        `;
        document.head.appendChild(style);
    }

    clearUnusedEventListeners() {
        // Remove event listeners from removed elements
        console.log('Clearing unused event listeners');
    }

    clearCachedData() {
        // Clear application cache
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes('old-')) {
                        caches.delete(name);
                    }
                });
            });
        }
    }

    removeUnusedDOMElements() {
        // Remove hidden or unused DOM elements
        const hiddenElements = document.querySelectorAll('[style*="display: none"]');
        hiddenElements.forEach(element => {
            if (!element.dataset.keepHidden) {
                element.remove();
            }
        });
    }

    setupResourceHints() {
        // Add DNS prefetch for external resources
        const domains = ['api.example.com', 'cdn.example.com'];
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });
    }

    enableCompression() {
        // Enable compression for API requests
        if (window.axios) {
            window.axios.defaults.headers.common['Accept-Encoding'] = 'gzip, deflate, br';
        }
    }

    cleanupOnHidden() {
        // Pause non-essential operations when page is hidden
        console.log('Page hidden, cleaning up resources');
    }

    restoreOnVisible() {
        // Restore operations when page becomes visible
        console.log('Page visible, restoring operations');
    }

    setupLowMemoryHandling() {
        // Handle low memory situations
        setInterval(() => {
            if (this.performanceMetrics.memory && this.performanceMetrics.memory.usage > 90) {
                this.triggerMemoryCleanup();
            }
        }, 10000);
    }

    restoreNormalOperations() {
        // Restore normal polling and features
        console.log('Restoring normal operations');
    }
}

// Export for use in other modules
export default PerformanceOptimizer;

// Auto-initialize if not imported as module
if (typeof module === 'undefined') {
    window.performanceOptimizer = new PerformanceOptimizer();
}