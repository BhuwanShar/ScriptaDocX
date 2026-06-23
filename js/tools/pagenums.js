/* ================================================================
   ScriptaDocX — Add Page Numbers
   ================================================================ */

var PageNumsTool = {
    id: 'pagenums',
    name: 'Add Page Numbers',
    description: 'Number every page of your PDF document',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    category: 'pdf',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div id="pn-upload"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Settings</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Position</div>' +
                    '<div class="setting-row__control">' +
                        '<select id="pn-pos">' +
                            '<option value="bottom-center">Bottom Center</option>' +
                            '<option value="bottom-right">Bottom Right</option>' +
                            '<option value="bottom-left">Bottom Left</option>' +
                            '<option value="top-center">Top Center</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Start Number</div>' +
                    '<div class="setting-row__control"><input type="number" id="pn-start" value="1" min="1" style="width:65px"></div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Font Size</div>' +
                    '<div class="setting-row__control">' +
                        '<input type="range" id="pn-size" min="8" max="24" value="12">' +
                        '<span class="range-value" id="pn-size-val">12</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="pn-start-btn" disabled>Add Page Numbers</button>' +
            '<div class="results-card" id="pn-results">' +
                '<div class="results-card__title">Page Numbers Added</div>' +
                '<div class="result-actions"><button class="result-btn" id="pn-download">Download PDF</button></div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('pn-upload'), '.pdf', function(file) {
            self.state.file = file;
            file.arrayBuffer().then(function(bytes) {
                self.state.bytes = bytes;
                document.getElementById('pn-start-btn').disabled = false;
            });
        });

        Utils.bindRange(document.getElementById('pn-size'), document.getElementById('pn-size-val'), 'default');

        document.getElementById('pn-start-btn').addEventListener('click', function() { self.execute(); });

        document.getElementById('pn-download').addEventListener('click', function() {
            if (self.state.result) Utils.downloadBlob(new Blob([self.state.result], { type: 'application/pdf' }), self.state.file.name.replace('.pdf', '-numbered.pdf'));
        });
    },

    execute: function() {
        var self = this;
        var PDFDocument = PDFLib.PDFDocument;
        var rgb = PDFLib.rgb;
        var StandardFonts = PDFLib.StandardFonts;

        PDFDocument.load(self.state.bytes).then(function(doc) {
            return doc.embedFont(StandardFonts.Helvetica).then(function(font) {
                var size = parseInt(document.getElementById('pn-size').value);
                var startNum = parseInt(document.getElementById('pn-start').value);
                var position = document.getElementById('pn-pos').value;

                doc.getPages().forEach(function(page, i) {
                    var dim = page.getSize();
                    var text = String(startNum + i);
                    var tw = font.widthOfTextAtSize(text, size);
                    var x, y;

                    switch (position) {
                        case 'bottom-center': x = dim.width / 2 - tw / 2; y = 30; break;
                        case 'bottom-right': x = dim.width - tw - 40; y = 30; break;
                        case 'bottom-left': x = 40; y = 30; break;
                        case 'top-center': x = dim.width / 2 - tw / 2; y = dim.height - 40; break;
                        default: x = dim.width / 2 - tw / 2; y = 30;
                    }

                    page.drawText(text, { x: x, y: y, size: size, font: font, color: rgb(0.3, 0.3, 0.3) });
                });

                return doc.save();
            });
        }).then(function(out) {
            self.state.result = out;
            document.getElementById('pn-results').classList.add('visible');
            Toast.success('Page numbers added');
        }).catch(function(err) {
            console.error(err);
            Toast.error('Failed to add page numbers');
        });
    }
};
