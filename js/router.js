/* ================================================================
   ScriptaDocX — View Router
   
   ================================================================ */

var Router = {
    currentView: 'home',

    init: function() {
        var self = this;

        var backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                self.navigate('home');
            });
        }

        var logoBtn = document.getElementById('logoBtn');
        if (logoBtn) {
            logoBtn.addEventListener('click', function() {
                self.navigate('home');
            });
        }
    },

    navigate: function(viewId, toolConfig) {
        var homeView = document.getElementById('view-home');
        var toolView = document.getElementById('view-tool');

        if (viewId === 'home') {
            toolView.classList.remove('active');
            toolView.classList.remove('view-enter');
            homeView.classList.add('active');
            this.currentView = 'home';
            document.title = 'ScriptaDocX \u2014 Free Document Toolkit';
        } else {
            homeView.classList.remove('active');
            toolView.classList.remove('active');
            toolView.classList.remove('view-enter');

            // Force reflow so animation replays
            void toolView.offsetWidth;

            toolView.classList.add('active');
            toolView.classList.add('view-enter');
            this.currentView = viewId;

            if (toolConfig) {
                this.renderToolView(toolConfig);
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderToolView: function(config) {
        document.getElementById('toolHeroIcon').innerHTML = config.icon;
        document.getElementById('toolHeroTitle').textContent = config.name;
        document.getElementById('toolHeroDesc').textContent = config.description;
        document.title = config.name + ' \u2014 ScriptaDocX';

        var body = document.getElementById('toolBody');
        body.innerHTML = '';

        if (config.render) {
            config.render(body);
        }
    }
};
