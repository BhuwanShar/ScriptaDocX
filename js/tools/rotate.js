/* ================================================================
   Scripta — Rotate Pages
   ================================================================ */

var RotateTool = {
    id: 'rotate',
    name: 'Rotate Pages',
    description: 'Rotate all or specific pages in your PDF',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    category: 'pdf',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div id="rotate-upload"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Rotation Settings</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Angle</div>' +
                    '<div class="setting-row__control">' +
                        '<select id="rotate-angle">' +
                            '<option value="90">90\u00B0 Clockwise</option>' +
                            '<option value="180">180\u00B0</option>' +
                            '<option value="270">90\u00B0 Counter-clockwise</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Pages<small>"all" or 1,3,5</small></div>' +
                    '<div class="setting-row__control"><input type="text" id="rotate-pages" value="all" style="width:110px"></div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="rotate-start" disabled>Rotate Pages</button>' +
            '<div class="results-card" id="rotate-results">' +
                '<div class="results-card__title">Pages Rotated</div>' +
                '<div class="result-actions"><button class="result-btn" id="rotate-download">Download PDF</button></div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('rotate-upload'), '.pdf', function(file) {
            self.state.file = file;
            file.arrayBuffer().then(function(bytes) {
                self.state.bytes = bytes;
                document.getElementById('rotate-start').disabled = false;
            });
        });

        document.getElementById('rotate-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('rotate-download').addEventListener('click', function() {
            if (self.state.result) Utils.downloadBlob(new Blob([self.state.result], { type: 'application/pdf' }), self.state.file.name.replace('.pdf', '-rotated.pdf'));
        });
    },

    execute: function() {
        var self = this;
        var PDFDocument = PDFLib.PDFDocument;
        var degrees = PDFLib.degrees;

        PDFDocument.load(self.state.bytes).then(function(doc) {
            var angle = parseInt(document.getElementById('rotate-angle').value);
            var pagesInput = document.getElementById('rotate-pages').value.trim();
            var pages = doc.getPages();

            if (pagesInput === 'all') {
                pages.forEach(function(p) { p.setRotation(degrees(p.getRotation().angle + angle)); });
            } else {
                var indices = pagesInput.split(',').map(function(n) { return parseInt(n.trim()) - 1; });
                indices.forEach(function(i) {
                    if (pages[i]) pages[i].setRotation(degrees(pages[i].getRotation().angle + angle));
                });
            }

            return doc.save();
        }).then(function(out) {
            self.state.result = out;
            document.getElementById('rotate-results').classList.add('visible');
            Toast.success('Pages rotated');
        }).catch(function(err) {
            console.error(err);
            Toast.error('Rotation failed');
        });
    }
};