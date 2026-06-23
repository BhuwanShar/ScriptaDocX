/* ================================================================
   Scripta — Add Watermark
   ================================================================ */

var WatermarkTool = {
    id: 'watermark',
    name: 'Add Watermark',
    description: 'Stamp a diagonal text watermark across all pages',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    category: 'pdf',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div id="wm-upload"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Watermark Settings</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Text</div>' +
                    '<div class="setting-row__control"><input type="text" id="wm-text" value="CONFIDENTIAL" style="width:160px"></div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Font Size</div>' +
                    '<div class="setting-row__control">' +
                        '<input type="range" id="wm-size" min="20" max="120" value="60">' +
                        '<span class="range-value" id="wm-size-val">60</span>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Opacity</div>' +
                    '<div class="setting-row__control">' +
                        '<input type="range" id="wm-opacity" min="0.05" max="0.5" step="0.05" value="0.15">' +
                        '<span class="range-value" id="wm-opacity-val">15%</span>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Rotation</div>' +
                    '<div class="setting-row__control">' +
                        '<input type="range" id="wm-rotation" min="-90" max="90" value="-45">' +
                        '<span class="range-value" id="wm-rotation-val">-45\u00B0</span>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Color</div>' +
                    '<div class="setting-row__control"><input type="color" id="wm-color" value="#888888"></div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="wm-start" disabled>Add Watermark</button>' +
            '<div class="results-card" id="wm-results">' +
                '<div class="results-card__title">Watermark Added</div>' +
                '<div class="result-actions"><button class="result-btn" id="wm-download">Download PDF</button></div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('wm-upload'), '.pdf', function(file) {
            self.state.file = file;
            file.arrayBuffer().then(function(bytes) {
                self.state.bytes = bytes;
                document.getElementById('wm-start').disabled = false;
            });
        });

        Utils.bindRange(document.getElementById('wm-size'), document.getElementById('wm-size-val'), 'default');
        Utils.bindRange(document.getElementById('wm-opacity'), document.getElementById('wm-opacity-val'), 'percent');
        Utils.bindRange(document.getElementById('wm-rotation'), document.getElementById('wm-rotation-val'), 'degrees');

        document.getElementById('wm-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('wm-download').addEventListener('click', function() {
            if (self.state.result) Utils.downloadBlob(new Blob([self.state.result], { type: 'application/pdf' }), self.state.file.name.replace('.pdf', '-watermarked.pdf'));
        });
    },

    execute: function() {
        var self = this;
        var PDFDocument = PDFLib.PDFDocument;
        var rgb = PDFLib.rgb;
        var degrees = PDFLib.degrees;
        var StandardFonts = PDFLib.StandardFonts;

        PDFDocument.load(self.state.bytes).then(function(doc) {
            return doc.embedFont(StandardFonts.Helvetica).then(function(font) {
                var text = document.getElementById('wm-text').value || 'WATERMARK';
                var size = parseInt(document.getElementById('wm-size').value);
                var opacity = parseFloat(document.getElementById('wm-opacity').value);
                var rotation = parseInt(document.getElementById('wm-rotation').value);
                var c = Utils.hexToRgb01(document.getElementById('wm-color').value);

                doc.getPages().forEach(function(page) {
                    var dim = page.getSize();
                    var tw = font.widthOfTextAtSize(text, size);
                    page.drawText(text, {
                        x: dim.width / 2 - tw / 2,
                        y: dim.height / 2,
                        size: size,
                        font: font,
                        color: rgb(c.r, c.g, c.b),
                        opacity: opacity,
                        rotate: degrees(rotation)
                    });
                });

                return doc.save();
            });
        }).then(function(out) {
            self.state.result = out;
            document.getElementById('wm-results').classList.add('visible');
            Toast.success('Watermark added');
        }).catch(function(err) {
            console.error(err);
            Toast.error('Watermark failed');
        });
    }
};