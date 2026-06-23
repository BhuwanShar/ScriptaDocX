/* ================================================================
   Scripta — OCR Extract Text
   ================================================================ */

var OCRTool = {
    id: 'ocr',
    name: 'OCR \u2014 Extract Text',
    description: 'Recognize and extract text from scanned PDFs or images',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    category: 'pdf',
    state: {},

    render: function(container) {
        var self = this;
        self.state = { selectedPage: 1 };

        container.innerHTML =
            '<div id="ocr-upload"></div>' +
            '<div class="thumb-strip" id="ocr-thumbs"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">OCR Settings</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Language</div>' +
                    '<div class="setting-row__control">' +
                        '<select id="ocr-lang">' +
                            '<option value="eng">English</option>' +
                            '<option value="spa">Spanish</option>' +
                            '<option value="fra">French</option>' +
                            '<option value="deu">German</option>' +
                            '<option value="ita">Italian</option>' +
                            '<option value="por">Portuguese</option>' +
                            '<option value="hin">Hindi</option>' +
                            '<option value="jpn">Japanese</option>' +
                            '<option value="chi_sim">Chinese (Simplified)</option>' +
                            '<option value="ara">Arabic</option>' +
                            '<option value="rus">Russian</option>' +
                            '<option value="kor">Korean</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Pages<small>Which pages to scan</small></div>' +
                    '<div class="setting-row__control">' +
                        '<select id="ocr-pages">' +
                            '<option value="all">All Pages</option>' +
                            '<option value="selected">Selected Page Only</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Render Quality<small>Higher = better, slower</small></div>' +
                    '<div class="setting-row__control">' +
                        '<input type="range" id="ocr-scale" min="1" max="4" step="0.5" value="2">' +
                        '<span class="range-value" id="ocr-scale-val">2x</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="ocr-start" disabled>Start OCR</button>' +
            '<div class="progress-section" id="ocr-progress">' +
                '<div class="progress-track"><div class="progress-fill" id="ocr-fill"></div></div>' +
                '<div class="progress-meta"><span id="ocr-status">Initializing...</span><span id="ocr-percent">0%</span></div>' +
            '</div>' +
            '<div class="results-card" id="ocr-results">' +
                '<div class="results-card__title">Extracted Text</div>' +
                '<div class="text-output" id="ocr-output"></div>' +
                '<div class="result-actions">' +
                    '<button class="result-btn" id="ocr-copy">Copy Text</button>' +
                    '<button class="result-btn" id="ocr-dl">Download .txt</button>' +
                '</div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('ocr-upload'), '.pdf, .png, .jpg, .jpeg, .bmp, .webp', function(file) {
            self.state.file = file;
            self.state.isImage = file.type.startsWith('image/');

            if (!self.state.isImage) {
                file.arrayBuffer().then(function(bytes) {
                    self.state.bytes = bytes;
                    return pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
                }).then(function(doc) {
                    self.state.pdfDoc = doc;
                    self.state.totalPages = doc.numPages;
                    Utils.renderThumbnails(doc, document.getElementById('ocr-thumbs'), function(page) {
                        self.state.selectedPage = page;
                    });
                    document.getElementById('ocr-start').disabled = false;
                    Toast.success('Loaded: ' + file.name + ' (' + doc.numPages + ' pages)');
                });
            } else {
                document.getElementById('ocr-start').disabled = false;
                Toast.success('Loaded image: ' + file.name);
            }
        });

        Utils.bindRange(document.getElementById('ocr-scale'), document.getElementById('ocr-scale-val'), 'multiplier');

        document.getElementById('ocr-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('ocr-copy').addEventListener('click', function() {
            if (navigator.clipboard && self.state.text) {
                navigator.clipboard.writeText(self.state.text);
                Toast.success('Copied to clipboard');
            }
        });

        document.getElementById('ocr-dl').addEventListener('click', function() {
            Utils.downloadBlob(new Blob([self.state.text || ''], { type: 'text/plain' }), 'ocr-result.txt');
        });
    },

    execute: function() {
        var self = this;
        var btn = document.getElementById('ocr-start');
        var fill = document.getElementById('ocr-fill');
        var status = document.getElementById('ocr-status');
        var percent = document.getElementById('ocr-percent');

        btn.disabled = true;
        document.getElementById('ocr-progress').classList.add('visible');
        document.getElementById('ocr-results').classList.remove('visible');

        var lang = document.getElementById('ocr-lang').value;
        var scale = parseFloat(document.getElementById('ocr-scale').value);
        var mode = document.getElementById('ocr-pages').value;

        Tesseract.createWorker(lang, 1, {
            logger: function(m) {
                if (m.status === 'recognizing text') {
                    fill.style.width = Math.round(m.progress * 100) + '%';
                }
                status.textContent = m.status;
            }
        }).then(function(worker) {
            var fullText = '';

            if (self.state.isImage) {
                status.textContent = 'Processing image...';
                return worker.recognize(self.state.file).then(function(result) {
                    fullText = result.data.text;
                    return worker.terminate();
                }).then(function() {
                    return fullText;
                });
            } else {
                var pages = [];
                if (mode === 'selected') {
                    pages = [self.state.selectedPage || 1];
                } else {
                    for (var i = 1; i <= self.state.totalPages; i++) pages.push(i);
                }

                var idx = 0;

                function processNext() {
                    if (idx >= pages.length) {
                        return worker.terminate().then(function() {
                            return fullText;
                        });
                    }

                    var pn = pages[idx];
                    status.textContent = 'OCR page ' + pn + ' of ' + pages.length + '...';

                    return Utils.renderPageToCanvas(self.state.pdfDoc, pn, scale).then(function(result) {
                        return worker.recognize(result.canvas);
                    }).then(function(result) {
                        fullText += '\n--- Page ' + pn + ' ---\n' + result.data.text + '\n';
                        idx++;
                        var overall = Math.round((idx / pages.length) * 100);
                        fill.style.width = overall + '%';
                        percent.textContent = overall + '%';
                        return processNext();
                    });
                }

                return processNext();
            }
        }).then(function(text) {
            self.state.text = text.trim();
            document.getElementById('ocr-output').textContent = self.state.text;
            document.getElementById('ocr-results').classList.add('visible');
            status.textContent = 'Complete';
            percent.textContent = '100%';
            Toast.success('OCR completed');
            btn.disabled = false;
        }).catch(function(err) {
            console.error(err);
            status.textContent = 'Error: ' + err.message;
            Toast.error('OCR failed');
            btn.disabled = false;
        });
    }
};