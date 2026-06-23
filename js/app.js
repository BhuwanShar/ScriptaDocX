/* ================================================================
   Scripta — Main Application
   Developed by Bhuwan Sharma
   ================================================================ */

var Scripta = {
    version: '1.0.0',
    author: 'Bhuwan Sharma',
    tools: [],
    router: Router,

    init: function() {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        Toast.init();
        ThemeManager.init();
        Router.init();

        this.registerTool(CompressTool);
        this.registerTool(OCRTool);
        this.registerTool(MergeTool);
        this.registerTool(SplitTool);
        this.registerTool(RotateTool);
        this.registerTool(WatermarkTool);
        this.registerTool(PageNumsTool);
        this.registerTool(MetadataTool);
        this.registerTool(PdfToImgTool);
        this.registerTool(ImgToPdfTool);
        this.registerTool(ImgCompressTool);
        this.registerTool(WordFreqTool);
        this.registerTool(SentimentTool);
        this.registerTool(TextCleanTool);
        this.registerTool(TFIDFTool);
        this.registerTool(ReadabilityTool);

        this.renderToolCards();
        this.renderHeaderNav();
        this.renderMobileNav();
        this.initMobileMenu();
        this.initScrollBehavior();
        this.initLandingAnimations();
        this.initFooterYear();

        console.log('Scripta v' + this.version + ' \u2014 by ' + this.author);
    },

    registerTool: function(tool) {
        this.tools.push(tool);
    },

    renderToolCards: function() {
        var self = this;
        var pdfGrid = document.getElementById('pdfToolsGrid');
        var imgGrid = document.getElementById('imgToolsGrid');
        var textGrid = document.getElementById('textToolsGrid');
        if (!pdfGrid || !imgGrid) return;

        for (var i = 0; i < this.tools.length; i++) {
            (function(tool, index) {
                var card = document.createElement('div');
                card.className = 'tool-card';
                card.style.animationDelay = (index * 50) + 'ms';
                var iconClass = tool.category === 'pdf' ? 'tool-card__icon--pdf' :
                                tool.category === 'img' ? 'tool-card__icon--img' : 'tool-card__icon--text';
                card.innerHTML =
                    '<div class="tool-card__icon ' + iconClass + '">' + tool.icon + '</div>' +
                    '<div class="tool-card__name">' + tool.name + '</div>' +
                    '<div class="tool-card__desc">' + tool.description + '</div>';
                card.addEventListener('click', function() { self.router.navigate(tool.id, tool); });
                if (tool.category === 'pdf') pdfGrid.appendChild(card);
                else if (tool.category === 'img') imgGrid.appendChild(card);
                else if (tool.category === 'text' && textGrid) textGrid.appendChild(card);
            })(this.tools[i], i);
        }
    },

    renderHeaderNav: function() {
        var self = this;
        var pdfMenu = document.getElementById('pdfNavMenu');
        var imgMenu = document.getElementById('imgNavMenu');
        var textMenu = document.getElementById('textNavMenu');
        if (!pdfMenu || !imgMenu) return;

        for (var i = 0; i < this.tools.length; i++) {
            (function(tool) {
                var item = document.createElement('div');
                item.className = 'nav-menu-item';
                var iconClass = 'nav-menu-item__icon--pdf';
                if (tool.category === 'img') iconClass = 'nav-menu-item__icon--img';
                if (tool.category === 'text') iconClass = 'nav-menu-item__icon--text';

                item.innerHTML =
                    '<div class="nav-menu-item__icon ' + iconClass + '">' + tool.icon + '</div>' +
                    '<span class="nav-menu-item__text">' + tool.name + '</span>';
                item.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.closeAllDropdowns();
                    self.router.navigate(tool.id, tool);
                });

                if (tool.category === 'pdf') pdfMenu.appendChild(item);
                else if (tool.category === 'img') imgMenu.appendChild(item);
                else if (tool.category === 'text' && textMenu) textMenu.appendChild(item);
            })(self.tools[i]);
        }

        this.initHeaderNav();
    },

    initHeaderNav: function() {
        var self = this;
        var triggers = document.querySelectorAll('.nav-trigger');

        for (var t = 0; t < triggers.length; t++) {
            triggers[t].addEventListener('click', function(e) {
                e.stopPropagation();
                var dropdown = this.parentElement;
                var isOpen = dropdown.classList.contains('open');
                self.closeAllDropdowns();
                if (!isOpen) {
                    dropdown.classList.add('open');
                }
            });
        }

        document.addEventListener('click', function() {
            self.closeAllDropdowns();
        });

        var menus = document.querySelectorAll('.nav-menu');
        for (var m = 0; m < menus.length; m++) {
            menus[m].addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    },

    closeAllDropdowns: function() {
        var dropdowns = document.querySelectorAll('.nav-dropdown');
        for (var d = 0; d < dropdowns.length; d++) {
            dropdowns[d].classList.remove('open');
        }
    },

    renderMobileNav: function() {
        var self = this;
        var pdfNav = document.getElementById('mobileNavPdf');
        var imgNav = document.getElementById('mobileNavImg');
        var textNav = document.getElementById('mobileNavText');
        if (!pdfNav || !imgNav) return;

        for (var i = 0; i < this.tools.length; i++) {
            (function(tool) {
                var item = document.createElement('div');
                item.className = 'mobile-nav-item';
                item.innerHTML = '<span>' + tool.name + '</span>';
                item.addEventListener('click', function() {
                    self.closeMobileMenu();
                    self.router.navigate(tool.id, tool);
                });
                if (tool.category === 'pdf') pdfNav.appendChild(item);
                else if (tool.category === 'img') imgNav.appendChild(item);
                else if (tool.category === 'text' && textNav) textNav.appendChild(item);
            })(this.tools[i]);
        }
    },

    initMobileMenu: function() {
        var self = this;
        var toggle = document.getElementById('mobileMenuToggle');
        var overlay = document.getElementById('mobileNavOverlay');
        if (!toggle || !overlay) return;

        toggle.addEventListener('click', function() {
            if (overlay.classList.contains('active')) {
                self.closeMobileMenu();
            } else {
                toggle.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) self.closeMobileMenu();
        });
    },

    closeMobileMenu: function() {
        var toggle = document.getElementById('mobileMenuToggle');
        var overlay = document.getElementById('mobileNavOverlay');
        if (toggle) toggle.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    initScrollBehavior: function() {
        var ctaBtn = document.getElementById('ctaExplore');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', function() {
                var s = document.getElementById('toolsSection');
                if (s) s.scrollIntoView({ behavior: 'smooth' });
            });
        }

        var scrollInd = document.getElementById('scrollIndicator');
        if (scrollInd) {
            scrollInd.addEventListener('click', function() {
                var s = document.getElementById('toolsSection');
                if (s) s.scrollIntoView({ behavior: 'smooth' });
            });
        }

        if ('IntersectionObserver' in window) {
            var cardObserver = new IntersectionObserver(function(entries) {
                for (var e = 0; e < entries.length; e++) {
                    if (entries[e].isIntersecting) {
                        entries[e].target.style.animationPlayState = 'running';
                        cardObserver.unobserve(entries[e].target);
                    }
                }
            }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

            setTimeout(function() {
                var cards = document.querySelectorAll('.tool-card');
                for (var c = 0; c < cards.length; c++) {
                    cards[c].style.animationPlayState = 'paused';
                    cardObserver.observe(cards[c]);
                }
            }, 80);
        }
    },

    initLandingAnimations: function() {
        var self = this;

        setTimeout(function() {
            var heroEls = document.querySelectorAll('.anim-hero');
            for (var h = 0; h < heroEls.length; h++) {
                heroEls[h].classList.add('visible');
            }
        }, 100);

        setTimeout(function() {
            var cards = document.querySelectorAll('.float-card');
            for (var f = 0; f < cards.length; f++) {
                cards[f].classList.add('visible');
            }
        }, 400);

        setTimeout(function() {
            var lines = document.querySelector('.connect-lines');
            if (lines) lines.classList.add('visible');
        }, 600);

        setTimeout(function() {
            self.animateCounters();
        }, 900);
    },

    animateCounters: function() {
        var counters = document.querySelectorAll('.landing-stat__number[data-count]');
        for (var i = 0; i < counters.length; i++) {
            (function(el) {
                var target = parseInt(el.getAttribute('data-count'));
                var duration = 1200;
                var startTime = null;

                function step(timestamp) {
                    if (!startTime) startTime = timestamp;
                    var progress = Math.min((timestamp - startTime) / duration, 1);
                    var eased = 1 - Math.pow(1 - progress, 4);
                    el.textContent = Math.round(target * eased);
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        el.textContent = target;
                        el.classList.add('counted');
                    }
                }

                requestAnimationFrame(step);
            })(counters[i]);
        }
    },

    initFooterYear: function() {
        var el = document.getElementById('footerYear');
        if (el) el.textContent = new Date().getFullYear();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    Scripta.init();
});