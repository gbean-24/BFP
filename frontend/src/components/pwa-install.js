// PWA Installation Component
class PWAInstallComponent {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.installBanner = null;
        this.init();
    }

    init() {
        this.checkInstallStatus();
        this.bindEvents();
        this.registerServiceWorker();
    }

    checkInstallStatus() {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('📱 PWA is installed and running in standalone mode');
        } else if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('📱 PWA is installed on iOS');
        }
    }

    bindEvents() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 PWA install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('📱 PWA was installed');
            this.isInstalled = true;
            this.hideInstallPrompt();
            this.showInstallSuccessMessage();
        });

        // Check for iOS Safari install prompt
        if (this.isIOSSafari() && !this.isInstalled) {
            setTimeout(() => {
                this.showIOSInstallPrompt();
            }, 5000); // Show after 5 seconds
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('📱 Service Worker registered:', registration);
                
                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateAvailablePrompt();
                        }
                    });
                });
                
                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
                
            } catch (error) {
                console.error('📱 Service Worker registration failed:', error);
            }
        }
    }

    showInstallPrompt() {
        if (this.isInstalled || this.installBanner) return;

        this.installBanner = document.createElement('div');
        this.installBanner.className = 'pwa-install-banner';
        this.installBanner.innerHTML = `
            <div class="install-content">
                <div class="install-icon">📱</div>
                <div class="install-text">
                    <h4>Install Tourism Safety Tracker</h4>
                    <p>Get quick access and work offline</p>
                </div>
                <div class="install-actions">
                    <button class="btn btn-primary install-btn">Install</button>
                    <button class="btn btn-secondary dismiss-btn">×</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.installBanner);
        this.addInstallStyles();

        // Bind button events
        this.installBanner.querySelector('.install-btn').addEventListener('click', () => {
            this.installApp();
        });

        this.installBanner.querySelector('.dismiss-btn').addEventListener('click', () => {
            this.hideInstallPrompt();
        });

        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (this.installBanner) {
                this.hideInstallPrompt();
            }
        }, 30000);
    }

    showIOSInstallPrompt() {
        if (this.isInstalled || this.installBanner) return;

        this.installBanner = document.createElement('div');
        this.installBanner.className = 'pwa-install-banner ios-install';
        this.installBanner.innerHTML = `
            <div class="install-content">
                <div class="install-icon">📱</div>
                <div class="install-text">
                    <h4>Install Tourism Safety Tracker</h4>
                    <p>Tap <span class="ios-share-icon">⎋</span> then "Add to Home Screen"</p>
                </div>
                <div class="install-actions">
                    <button class="btn btn-secondary dismiss-btn">Got it</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.installBanner);
        this.addInstallStyles();

        this.installBanner.querySelector('.dismiss-btn').addEventListener('click', () => {
            this.hideInstallPrompt();
        });

        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (this.installBanner) {
                this.hideInstallPrompt();
            }
        }, 15000);
    }

    async installApp() {
        if (!this.deferredPrompt) return;

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log('📱 PWA install outcome:', outcome);
            
            if (outcome === 'accepted') {
                console.log('📱 User accepted the install prompt');
            } else {
                console.log('📱 User dismissed the install prompt');
            }
            
            this.deferredPrompt = null;
            this.hideInstallPrompt();
        } catch (error) {
            console.error('📱 Install prompt failed:', error);
        }
    }

    hideInstallPrompt() {
        if (this.installBanner) {
            this.installBanner.classList.add('hiding');
            setTimeout(() => {
                if (this.installBanner && this.installBanner.parentNode) {
                    this.installBanner.parentNode.removeChild(this.installBanner);
                }
                this.installBanner = null;
            }, 300);
        }
    }

    showInstallSuccessMessage() {
        const successMessage = document.createElement('div');
        successMessage.className = 'install-success-toast';
        successMessage.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <span>App installed successfully!</span>
            </div>
        `;

        document.body.appendChild(successMessage);

        setTimeout(() => {
            successMessage.classList.add('hiding');
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.parentNode.removeChild(successMessage);
                }
            }, 300);
        }, 3000);
    }

    showUpdateAvailablePrompt() {
        const updatePrompt = document.createElement('div');
        updatePrompt.className = 'pwa-update-prompt';
        updatePrompt.innerHTML = `
            <div class="update-content">
                <div class="update-icon">🔄</div>
                <div class="update-text">
                    <h4>Update Available</h4>
                    <p>A new version is ready to install</p>
                </div>
                <div class="update-actions">
                    <button class="btn btn-primary update-btn">Update</button>
                    <button class="btn btn-secondary dismiss-update-btn">Later</button>
                </div>
            </div>
        `;

        document.body.appendChild(updatePrompt);

        updatePrompt.querySelector('.update-btn').addEventListener('click', () => {
            this.updateApp();
            updatePrompt.remove();
        });

        updatePrompt.querySelector('.dismiss-update-btn').addEventListener('click', () => {
            updatePrompt.remove();
        });
    }

    updateApp() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration && registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                }
            });
        }
    }

    addInstallStyles() {
        if (!document.getElementById('pwa-install-styles')) {
            const style = document.createElement('style');
            style.id = 'pwa-install-styles';
            style.textContent = `
                .pwa-install-banner {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.3);
                    z-index: 10000;
                    animation: slideInUp 0.3s ease-out;
                    max-width: 400px;
                    margin: 0 auto;
                }

                .pwa-install-banner.hiding {
                    animation: slideOutDown 0.3s ease-in;
                }

                .install-content {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    gap: 1rem;
                }

                .install-icon {
                    font-size: 2rem;
                    flex-shrink: 0;
                }

                .install-text {
                    flex: 1;
                }

                .install-text h4 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1rem;
                    font-weight: 600;
                }

                .install-text p {
                    margin: 0;
                    font-size: 0.875rem;
                    opacity: 0.9;
                }

                .install-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-shrink: 0;
                }

                .install-actions .btn {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .install-actions .btn-primary {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    backdrop-filter: blur(10px);
                }

                .install-actions .btn-primary:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }

                .install-actions .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }

                .install-actions .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .ios-install .ios-share-icon {
                    display: inline-block;
                    font-weight: bold;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 0.125rem 0.375rem;
                    border-radius: 4px;
                    margin: 0 0.25rem;
                }

                .install-success-toast {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #10b981;
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
                    z-index: 10001;
                    animation: slideInDown 0.3s ease-out;
                }

                .install-success-toast.hiding {
                    animation: slideOutUp 0.3s ease-in;
                }

                .success-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .success-icon {
                    font-size: 1.2rem;
                }

                .pwa-update-prompt {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3);
                    z-index: 10000;
                    animation: slideInDown 0.3s ease-out;
                    max-width: 400px;
                    margin: 0 auto;
                }

                .update-content {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    gap: 1rem;
                }

                .update-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                    animation: spin 2s linear infinite;
                }

                .update-text {
                    flex: 1;
                }

                .update-text h4 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1rem;
                    font-weight: 600;
                }

                .update-text p {
                    margin: 0;
                    font-size: 0.875rem;
                    opacity: 0.9;
                }

                .update-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-shrink: 0;
                }

                .update-actions .btn {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .update-actions .btn-primary {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .update-actions .btn-primary:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .update-actions .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .update-actions .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideOutDown {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(100%);
                    }
                }

                @keyframes slideInDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                @keyframes slideOutUp {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-100%);
                    }
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (max-width: 768px) {
                    .pwa-install-banner,
                    .pwa-update-prompt {
                        left: 10px;
                        right: 10px;
                        bottom: 10px;
                    }

                    .install-content,
                    .update-content {
                        padding: 0.75rem;
                        gap: 0.75rem;
                    }

                    .install-actions,
                    .update-actions {
                        flex-direction: column;
                        gap: 0.25rem;
                    }

                    .install-actions .btn,
                    .update-actions .btn {
                        width: 100%;
                    }

                    .install-actions .btn-secondary {
                        width: 32px;
                        align-self: flex-end;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    isIOSSafari() {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent) && !/crios|fxios/.test(userAgent);
    }

    // Public methods
    getInstallStatus() {
        return {
            isInstalled: this.isInstalled,
            canInstall: !!this.deferredPrompt,
            isIOSSafari: this.isIOSSafari()
        };
    }

    triggerInstallPrompt() {
        if (this.deferredPrompt) {
            this.showInstallPrompt();
        } else if (this.isIOSSafari()) {
            this.showIOSInstallPrompt();
        }
    }
}

export default PWAInstallComponent;