/* ================================================================
   Scripta — Split PDF
   ================================================================ */

var SplitTool = {
    id: 'split',
    name: 'Split PDF',
    description: 'Extract specific pages from a PDF into a new document',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    category: 'pdf',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div id="split-upload"></div>' +
            '<div class="thumb-strip" id="split-thumbs"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Split Settings</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Page Range<small>e.g. 1-3, 5, 7-10</small></div>' +
                    '<div class="setting-row__control"><input type="text" id="split-range" placeholder="1-5" style="width:140px"></div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="split-start" disabled>Split PDF</button>' +
            '<div class="results-card" id="split-results">' +
                '<div class="results-card__title">PDF Split Successfully</div>' +
                '<div class="result-actions"><button class="result-btn" id="split-download">Download Split PDF</button></div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('split-upload'), '.pdf', function(file) {
            self.state.file = file;
            file.arrayBuffer().then(function(bytes) {
                self.state.bytes = bytes;
                return pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
            }).then(function(doc) {
                self.state.totalPages = doc.numPages;
                Utils.renderThumbnails(doc, document.getElementById('split-thumbs'));
                document.getElementById('split-range').placeholder = '1-' + doc.numPages;
                document.getElementById('split-start').disabled = false;
                Toast.success('Loaded: ' + doc.numPages + ' pages');
            });
        });

        document.getElementById('split-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('split-download').addEventListener('click', function() {
            if (self.state.result) Utils.downloadBlob(new Blob([self.state.result], { type: 'application/pdf' }), 'split.pdf');
        });
    },

    execute: function() {
        var self = this;
        var range = document.getElementById('split-range').value || ('1-' + self.state.totalPages);
        var indices = Utils.parsePageRange(range, self.state.totalPages);

        if (!indices.length) {
            Toast.error('Invalid page range');
            return;
        }

        var PDFDocument = PDFLib.PDFDocument;

        PDFDocument.load(self.state.bytes).then(function(src) {
            return PDFDocument.create().then(function(newDoc) {
                return newDoc.copyPages(src, indices).then(function(pages) {
                    pages.forEach(function(p) { newDoc.addPage(p); });
                    return newDoc.save();
                });
            });
        }).then(function(out) {
            self.state.result = out;
            document.getElementById('split-results').classList.add('visible');
            Toast.success('Extracted ' + indices.length + ' pages');
        }).catch(function(err) {
            console.error(err);
            Toast.error('Split failed');
        });
    }
};/* ================================================================
   Scripta — Split PDF
   ================================================================ */

var SplitTool = {
    id: 'split',
    name: 'Split PDF',
    description: 'Extract specific pages from a PDF into a new document',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    category: 'pdf',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div id="split-upload"></div>' +
            '<div class="thumb-strip" id="split-thumbs"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Split Settings</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Page Range<small>e.g. 1-3, 5, 7-10</small></div>' +
                    '<div class="setting-row__control"><input type="text" id="split-range" placeholder="1-5" style="width:140px"></div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="split-start" disabled>Split PDF</button>' +
            '<div class="results-card" id="split-results">' +
                '<div class="results-card__title">PDF Split Successfully</div>' +
                '<div class="result-actions"><button class="result-btn" id="split-download">Download Split PDF</button></div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('split-upload'), '.pdf', function(file) {
            self.state.file = file;
            file.arrayBuffer().then(function(bytes) {
                self.state.bytes = bytes;
                return pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
            }).then(function(doc) {
                self.state.totalPages = doc.numPages;
                Utils.renderThumbnails(doc, document.getElementById('split-thumbs'));
                document.getElementById('split-range').placeholder = '1-' + doc.numPages;
                document.getElementById('split-start').disabled = false;
                Toast.success('Loaded: ' + doc.numPages + ' pages');
            });
        });

        document.getElementById('split-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('split-download').addEventListener('click', function() {
            if (self.state.result) Utils.downloadBlob(new Blob([self.state.result], { type: 'application/pdf' }), 'split.pdf');
        });
    },

    execute: function() {
        var self = this;
        var range = document.getElementById('split-range').value || ('1-' + self.state.totalPages);
        var indices = Utils.parsePageRange(range, self.state.totalPages);

        if (!indices.length) {
            Toast.error('Invalid page range');
            return;
        }

        var PDFDocument = PDFLib.PDFDocument;

        PDFDocument.load(self.state.bytes).then(function(src) {
            return PDFDocument.create().then(function(newDoc) {
                return newDoc.copyPages(src, indices).then(function(pages) {
                    pages.forEach(function(p) { newDoc.addPage(p); });
                    return newDoc.save();
                });
            });
        }).then(function(out) {
            self.state.result = out;
            document.getElementById('split-results').classList.add('visible');
            Toast.success('Extracted ' + indices.length + ' pages');
        }).catch(function(err) {
            console.error(err);
            Toast.error('Split failed');
        });
    }
};