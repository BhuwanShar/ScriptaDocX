/* ================================================================
   Scripta — Toast Notification System
   Developed by Bhuwan Sharma
   ================================================================ */

var Toast = {
    container: null,

    init: function() {
        this.container = document.getElementById('toastContainer');
    },

    show: function(message, type) {
        if (!this.container) this.init();
        type = type || 'default';

        var el = document.createElement('div');
        el.className = 'toast toast--' + type;
        el.textContent = message;
        this.container.appendChild(el);

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                el.classList.add('visible');
            });
        });

        setTimeout(function() {
            el.classList.remove('visible');
            setTimeout(function() {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 300);
        }, 3000);
    },

    success: function(msg) { this.show(msg, 'success'); },
    error: function(msg) { this.show(msg, 'error'); },
    info: function(msg) { this.show(msg, 'default'); }
};