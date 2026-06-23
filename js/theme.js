/* ================================================================
   Scripta — Theme Manager
   Developed by Bhuwan Sharma
   ================================================================ */

var ThemeManager = {
    storageKey: 'scripta-theme',
    current: 'dark',

    init: function() {
        var self = this;

        var saved = localStorage.getItem(this.storageKey);
        this.apply(saved || 'dark');

        var btn = document.getElementById('themeToggle');
        if (btn) {
            btn.addEventListener('click', function() {
                self.toggle();
            });
        }
    },

    apply: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.current = theme;
    },

    toggle: function() {
        var next = this.current === 'dark' ? 'light' : 'dark';
        this.apply(next);
        localStorage.setItem(this.storageKey, next);
        Toast.info('Switched to ' + next + ' mode');
    }
};