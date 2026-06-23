/* ================================================================
   Scripta — PDF to Images
   ================================================================ */

var PdfToImgTool = {
    id: 'pdftoimg',
    name: 'PDF to Images',
    description: 'Convert each PDF page to a downloadable JPG or PNG image',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    category: 'img',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div id="p2i-upload"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Settings</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Format</div>' +
                    '<div class="setting-row__control"><select id="p2i-format"><option value="jpeg">JPEG</option><option value="png">PNG</option></select></div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Scale</div>' +
                    '<div class="setting-row__control">' +
                        '<input type="range" id="p2i-scale" min="1" max="3" step="0.5" value="2">' +
                        '<span class="range-value" id="p2i-scale-val">2x</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="p2i-start" disabled>Convert to Images</button>' +
            '<div class="progress-section" id="p2i-progress">' +
                '<div class="progress-track"><div class="progress-fill" id="p2i-fill"></div></div>' +
                '<div class="progress-meta"><span id="p2i-status">Converting...</span><span id="p2i-percent">0%</span></div>' +
            '</div>' +
            '<div class="results-card" id="p2i-results">' +
                '<div class="results-card__title">Images Ready \u2014 Click to download</div>' +
                '<div class="image-results-grid" id="p2i-grid"></div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('p2i-upload'), '.pdf', function(file) {
            file.arrayBuffer().then(function(bytes) {
                self.state.bytes = bytes;
                return pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
            }).then(function(doc) {
                self.state.pdfDoc = doc;
                document.getElementById('p2i-start').disabled = false;
            });
        });

        Utils.bindRange(document.getElementById('p2i-scale'), document.getElementById('p2i-scale-val'), 'multiplier');

        document.getElementById('p2i-start').addEventListener('click', function() { self.execute(); });
    },

    execute: function() {
        var self = this;
        var btn = document.getElementById('p2i-start');
        btn.disabled = true;
        var fill = document.getElementById('p2i-fill');
        var status = document.getElementById('p2i-status');
        var grid = document.getElementById('p2i-grid');
        grid.innerHTML = '';
        document.getElementById('p2i-progress').classList.add('visible');
        document.getElementById('p2i-results').classList.remove('visible');

        var scale = parseFloat(document.getElementById('p2i-scale').value);
        var format = document.getElementById('p2i-format').value;
        var mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        var total = self.state.pdfDoc.numPages;
        var current = 0;

        function convertNext() {
            current++;
            if (current > total) {
                document.getElementById('p2i-results').classList.add('visible');
                status.textContent = 'Complete';
                Toast.success('All pages converted');
                btn.disabled = false;
                return;
            }

            status.textContent = 'Page ' + current + ' of ' + total;
            fill.style.width = Math.round((current / total) * 100) + '%';

            Utils.renderPageToCanvas(self.state.pdfDoc, current, scale).then(function(result) {
                result.canvas.toBlob(function(blob) {
                    var url = URL.createObjectURL(blob);
                    var link = document.createElement('a');
                    link.href = url;
                    link.download = 'page-' + current + '.' + format;
                    var img = document.createElement('img');
                    img.src = url;
                    img.alt = 'Page ' + current;
                    img.title = 'Page ' + current + ' \u2014 Click to download';
                    link.appendChild(img);
                    grid.appendChild(link);
                    convertNext();
                }, mimeType, 0.92);
            });
        }

        convertNext();
    }
};