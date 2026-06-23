/* ================================================================
   ScriptaDocX — Compress PDF
   ================================================================ */

var CompressTool = {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size by optimizing images and resolution',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    category: 'pdf',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div id="cmp-upload"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Compression Settings</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Image Quality<small>Lower = smaller file</small></div>' +
                    '<div class="setting-row__control">' +
                        '<input type="range" id="cmp-quality" min="0.1" max="0.95" step="0.05" value="0.5">' +
                        '<span class="range-value" id="cmp-quality-val">50%</span>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Render Scale<small>Resolution multiplier</small></div>' +
                    '<div class="setting-row__control">' +
                        '<input type="range" id="cmp-scale" min="0.5" max="2" step="0.25" value="1.5">' +
                        '<span class="range-value" id="cmp-scale-val">1.5x</span>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Max Dimension<small>Cap image size</small></div>' +
                    '<div class="setting-row__control">' +
                        '<select id="cmp-maxdim">' +
                            '<option value="4096">4096px</option>' +
                            '<option value="2048" selected>2048px</option>' +
                            '<option value="1536">1536px</option>' +
                            '<option value="1024">1024px</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="cmp-start" disabled>Compress PDF</button>' +
            '<div class="progress-section" id="cmp-progress">' +
                '<div class="progress-track"><div class="progress-fill" id="cmp-fill"></div></div>' +
                '<div class="progress-meta"><span id="cmp-status">Processing...</span><span id="cmp-percent">0%</span></div>' +
            '</div>' +
            '<div class="results-card" id="cmp-results">' +
                '<div class="results-card__title">Compression Complete</div>' +
                '<div class="stats-grid">' +
                    '<div class="stat-box"><div class="stat-box__value" id="cmp-orig">-</div><div class="stat-box__label">Original</div></div>' +
                    '<div class="stat-box"><div class="stat-box__value" id="cmp-new">-</div><div class="stat-box__label">Compressed</div></div>' +
                    '<div class="stat-box"><div class="stat-box__value" id="cmp-saved">-</div><div class="stat-box__label">Reduced</div></div>' +
                '</div>' +
                '<div class="result-actions"><button class="result-btn" id="cmp-download">Download Compressed PDF</button></div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('cmp-upload'), '.pdf', function(file) {
            self.state.file = file;
            file.arrayBuffer().then(function(bytes) {
                self.state.bytes = bytes;
                return pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
            }).then(function(doc) {
                self.state.pdfDoc = doc;
                document.getElementById('cmp-start').disabled = false;
                Toast.success('Loaded: ' + file.name + ' (' + doc.numPages + ' pages)');
            });
        });

        Utils.bindRange(document.getElementById('cmp-quality'), document.getElementById('cmp-quality-val'), 'percent');
        Utils.bindRange(document.getElementById('cmp-scale'), document.getElementById('cmp-scale-val'), 'multiplier');

        document.getElementById('cmp-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('cmp-download').addEventListener('click', function() {
            if (self.state.result) {
                Utils.downloadBlob(
                    new Blob([self.state.result], { type: 'application/pdf' }),
                    self.state.file.name.replace('.pdf', '-compressed.pdf')
                );
            }
        });
    },

    execute: function() {
        var self = this;
        var btn = document.getElementById('cmp-start');
        var fill = document.getElementById('cmp-fill');
        var status = document.getElementById('cmp-status');
        var percent = document.getElementById('cmp-percent');

        btn.disabled = true;
        document.getElementById('cmp-progress').classList.add('visible');
        document.getElementById('cmp-results').classList.remove('visible');

        var quality = parseFloat(document.getElementById('cmp-quality').value);
        var scale = parseFloat(document.getElementById('cmp-scale').value);
        var maxDim = parseInt(document.getElementById('cmp-maxdim').value);
        var PDFDocument = PDFLib.PDFDocument;

        PDFDocument.create().then(function(newPdf) {
            var total = self.state.pdfDoc.numPages;
            var current = 0;

            function processPage() {
                current++;
                if (current > total) {
                    return newPdf.save().then(function(outBytes) {
                        self.state.result = outBytes;
                        var origSize = self.state.bytes.byteLength;
                        var newSize = outBytes.byteLength;
                        var savedPct = ((1 - newSize / origSize) * 100).toFixed(1);

                        document.getElementById('cmp-orig').textContent = Utils.formatBytes(origSize);
                        document.getElementById('cmp-new').textContent = Utils.formatBytes(newSize);
                        document.getElementById('cmp-saved').textContent = savedPct + '%';
                        document.getElementById('cmp-results').classList.add('visible');
                        status.textContent = 'Complete';

                        if (newSize >= origSize) {
                            Toast.info('File already optimized. Try lower quality settings.');
                        } else {
                            Toast.success('Compressed! Reduced by ' + savedPct + '%');
                        }
                        btn.disabled = false;
                    });
                }

                var pct = Math.round((current / total) * 100);
                fill.style.width = pct + '%';
                percent.textContent = pct + '%';
                status.textContent = 'Page ' + current + ' of ' + total + '...';

                return Utils.renderPageToCanvas(self.state.pdfDoc, current, scale).then(function(result) {
                    var canvas = result.canvas;
                    var origVp = result.origViewport;

                    // Check max dimension
                    var maxOrig = Math.max(canvas.width, canvas.height);
                    if (maxOrig > maxDim) {
                        var ratio = maxDim / maxOrig;
                        var smallCanvas = document.createElement('canvas');
                        smallCanvas.width = Math.round(canvas.width * ratio);
                        smallCanvas.height = Math.round(canvas.height * ratio);
                        smallCanvas.getContext('2d').drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
                        canvas = smallCanvas;
                    }

                    var jpgDataUrl = canvas.toDataURL('image/jpeg', quality);
                    var jpgBytes = Utils.dataUrlToBytes(jpgDataUrl);

                    return newPdf.embedJpg(jpgBytes).then(function(img) {
                        var page = newPdf.addPage([origVp.width, origVp.height]);
                        page.drawImage(img, { x: 0, y: 0, width: origVp.width, height: origVp.height });

                        // Yield to UI thread
                        return new Promise(function(resolve) {
                            setTimeout(resolve, 5);
                        });
                    });
                }).then(processPage);
            }

            return processPage();
        }).catch(function(err) {
            console.error(err);
            status.textContent = 'Error: ' + err.message;
            Toast.error('Compression failed');
            btn.disabled = false;
        });
    }
};
