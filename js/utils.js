/* ================================================================
   Scripta — Utility Functions
   Developed by Bhuwan Sharma
   ================================================================ */

var Utils = {

    formatBytes: function(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    dataUrlToBytes: function(dataUrl) {
        var base64 = dataUrl.split(',')[1];
        var binary = atob(base64);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    },

    downloadBlob: function(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    },

    parsePageRange: function(rangeStr, maxPages) {
        var pages = [];
        var seen = {};
        var parts = rangeStr.split(',');
        for (var p = 0; p < parts.length; p++) {
            var part = parts[p].trim();
            if (!part) continue;
            if (part.indexOf('-') !== -1) {
                var bounds = part.split('-');
                var start = parseInt(bounds[0]);
                var end = parseInt(bounds[1]);
                if (!isNaN(start) && !isNaN(end)) {
                    for (var i = Math.max(1, start); i <= Math.min(end, maxPages); i++) {
                        if (!seen[i - 1]) {
                            pages.push(i - 1);
                            seen[i - 1] = true;
                        }
                    }
                }
            } else {
                var n = parseInt(part);
                if (!isNaN(n) && n >= 1 && n <= maxPages && !seen[n - 1]) {
                    pages.push(n - 1);
                    seen[n - 1] = true;
                }
            }
        }
        return pages.sort(function(a, b) { return a - b; });
    },

    hexToRgb01: function(hex) {
        hex = hex.replace('#', '');
        return {
            r: parseInt(hex.substring(0, 2), 16) / 255,
            g: parseInt(hex.substring(2, 4), 16) / 255,
            b: parseInt(hex.substring(4, 6), 16) / 255
        };
    },

    createUploadZone: function(container, accept, onFile) {
        container.innerHTML =
            '<div class="upload-zone" data-role="drop-zone">' +
                '<div class="upload-zone__icon">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
                        '<polyline points="17 8 12 3 7 8"/>' +
                        '<line x1="12" y1="3" x2="12" y2="15"/>' +
                    '</svg>' +
                '</div>' +
                '<p class="upload-zone__label">Drop file here or <strong>browse</strong></p>' +
                '<p class="upload-zone__formats">' + accept + '</p>' +
                '<p class="upload-zone__filename" data-role="filename"></p>' +
            '</div>' +
            '<input type="file" accept="' + accept + '" style="display:none" data-role="file-input">';

        var zone = container.querySelector('[data-role="drop-zone"]');
        var input = container.querySelector('[data-role="file-input"]');
        var filenameEl = container.querySelector('[data-role="filename"]');

        zone.addEventListener('click', function() { input.click(); });

        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', function() {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });

        input.addEventListener('change', function(e) {
            if (e.target.files[0]) handleFile(e.target.files[0]);
        });

        function handleFile(file) {
            filenameEl.textContent = file.name + ' (' + Utils.formatBytes(file.size) + ')';
            onFile(file);
        }
    },

    renderThumbnails: function(pdfDoc, container, onSelect) {
        container.innerHTML = '';
        var max = Math.min(pdfDoc.numPages, 30);
        var rendered = 0;

        function renderNext(pageNum) {
            if (pageNum > max) return;
            pdfDoc.getPage(pageNum).then(function(page) {
                var vp = page.getViewport({ scale: 0.25 });
                var canvas = document.createElement('canvas');
                canvas.width = vp.width;
                canvas.height = vp.height;
                var ctx = canvas.getContext('2d');

                page.render({ canvasContext: ctx, viewport: vp }).promise.then(function() {
                    var item = document.createElement('div');
                    item.className = 'thumb-item' + (pageNum === 1 ? ' selected' : '');
                    item.dataset.page = pageNum;

                    var num = document.createElement('span');
                    num.className = 'thumb-item__num';
                    num.textContent = pageNum;

                    item.appendChild(canvas);
                    item.appendChild(num);

                    item.addEventListener('click', function() {
                        var all = container.querySelectorAll('.thumb-item');
                        for (var t = 0; t < all.length; t++) all[t].classList.remove('selected');
                        item.classList.add('selected');
                        if (onSelect) onSelect(pageNum);
                    });

                    container.appendChild(item);
                    renderNext(pageNum + 1);
                });
            });
        }

        renderNext(1);
    },

    renderPageToCanvas: function(pdfDoc, pageNum, scale) {
        return pdfDoc.getPage(pageNum).then(function(page) {
            var viewport = page.getViewport({ scale: scale });
            var origViewport = page.getViewport({ scale: 1 });
            var canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            var ctx = canvas.getContext('2d');
            return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function() {
                return { canvas: canvas, viewport: viewport, origViewport: origViewport };
            });
        });
    },

    bindRange: function(rangeEl, displayEl, format) {
        function update() {
            var v = parseFloat(rangeEl.value);
            if (format === 'percent') {
                displayEl.textContent = Math.round(v * 100) + '%';
            } else if (format === 'multiplier') {
                displayEl.textContent = v + 'x';
            } else if (format === 'degrees') {
                displayEl.textContent = v + '\u00B0';
            } else {
                displayEl.textContent = v;
            }
        }
        rangeEl.addEventListener('input', update);
        update();
    }
};