/* ================================================================
   ScriptaDocX — Compress Image
   ================================================================ */

var ImgCompressTool = {
    id: 'imgcompress',
    name: 'Compress Image',
    description: 'Reduce image file size by adjusting quality and dimensions',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 14l2-2 4 4"/><circle cx="14.5" cy="9.5" r="1.5"/></svg>',
    category: 'img',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div id="ic-upload"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Settings</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Quality</div>' +
                    '<div class="setting-row__control">' +
                        '<input type="range" id="ic-quality" min="0.1" max="0.95" step="0.05" value="0.5">' +
                        '<span class="range-value" id="ic-quality-val">50%</span>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Max Width (px)</div>' +
                    '<div class="setting-row__control"><input type="number" id="ic-maxw" value="1920" style="width:85px"></div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Output Format</div>' +
                    '<div class="setting-row__control">' +
                        '<select id="ic-format">' +
                            '<option value="image/jpeg">JPEG</option>' +
                            '<option value="image/webp">WebP</option>' +
                            '<option value="image/png">PNG</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="ic-start" disabled>Compress Image</button>' +
            '<div class="results-card" id="ic-results">' +
                '<div class="results-card__title">Image Compressed</div>' +
                '<div class="stats-grid">' +
                    '<div class="stat-box"><div class="stat-box__value" id="ic-orig">-</div><div class="stat-box__label">Original</div></div>' +
                    '<div class="stat-box"><div class="stat-box__value" id="ic-new">-</div><div class="stat-box__label">Compressed</div></div>' +
                    '<div class="stat-box"><div class="stat-box__value" id="ic-saved">-</div><div class="stat-box__label">Reduced</div></div>' +
                '</div>' +
                '<div class="result-actions"><button class="result-btn" id="ic-download">Download Image</button></div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('ic-upload'), 'image/*', function(file) {
            self.state.file = file;
            document.getElementById('ic-start').disabled = false;
        });

        Utils.bindRange(document.getElementById('ic-quality'), document.getElementById('ic-quality-val'), 'percent');

        document.getElementById('ic-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('ic-download').addEventListener('click', function() {
            if (self.state.result) {
                var ext = document.getElementById('ic-format').value.split('/')[1];
                Utils.downloadBlob(self.state.result, 'compressed.' + ext);
            }
        });
    },

    execute: function() {
        var self = this;

        createImageBitmap(self.state.file).then(function(bmp) {
            var maxW = parseInt(document.getElementById('ic-maxw').value);
            var quality = parseFloat(document.getElementById('ic-quality').value);
            var format = document.getElementById('ic-format').value;

            var w = bmp.width;
            var h = bmp.height;
            if (w > maxW) {
                h = Math.round(h * maxW / w);
                w = maxW;
            }

            var c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            c.getContext('2d').drawImage(bmp, 0, 0, w, h);

            c.toBlob(function(blob) {
                self.state.result = blob;
                document.getElementById('ic-orig').textContent = Utils.formatBytes(self.state.file.size);
                document.getElementById('ic-new').textContent = Utils.formatBytes(blob.size);
                var saved = ((1 - blob.size / self.state.file.size) * 100).toFixed(1);
                document.getElementById('ic-saved').textContent = saved + '%';
                document.getElementById('ic-results').classList.add('visible');
                Toast.success('Image compressed');
            }, format, quality);
        }).catch(function(err) {
            console.error(err);
            Toast.error('Compression failed');
        });
    }
};
