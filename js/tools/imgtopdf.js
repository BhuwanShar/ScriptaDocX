/* ================================================================
   Scripta — Images to PDF
   ================================================================ */

var ImgToPdfTool = {
    id: 'imgtopdf',
    name: 'Images to PDF',
    description: 'Combine multiple images into a single PDF document',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    category: 'img',
    state: { files: [] },

    render: function(container) {
        var self = this;
        self.state = { files: [], result: null };

        container.innerHTML =
            '<label class="multi-upload-btn" for="i2p-input">+ Add Images</label>' +
            '<input type="file" id="i2p-input" accept="image/*" multiple style="display:none">' +
            '<div class="file-list" id="i2p-list"></div>' +
            '<button class="action-btn action-btn--primary" id="i2p-start" disabled>Create PDF</button>' +
            '<div class="results-card" id="i2p-results">' +
                '<div class="results-card__title">PDF Created</div>' +
                '<div class="result-actions"><button class="result-btn" id="i2p-download">Download PDF</button></div>' +
            '</div>';

        document.getElementById('i2p-input').addEventListener('change', function(e) {
            for (var i = 0; i < e.target.files.length; i++) {
                self.state.files.push(e.target.files[i]);
            }
            self.renderList();
            e.target.value = '';
        });

        document.getElementById('i2p-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('i2p-download').addEventListener('click', function() {
            if (self.state.result) Utils.downloadBlob(new Blob([self.state.result], { type: 'application/pdf' }), 'images-combined.pdf');
        });
    },

    renderList: function() {
        var self = this;
        var list = document.getElementById('i2p-list');
        list.innerHTML = '';

        self.state.files.forEach(function(f, i) {
            var item = document.createElement('div');
            item.className = 'file-list-item';
            item.innerHTML =
                '<div class="file-list-item__info"><span>' + f.name + ' (' + Utils.formatBytes(f.size) + ')</span></div>' +
                '<button class="file-list-item__remove" data-idx="' + i + '">\u00D7</button>';
            list.appendChild(item);
        });

        var btns = list.querySelectorAll('.file-list-item__remove');
        for (var b = 0; b < btns.length; b++) {
            btns[b].addEventListener('click', function() {
                self.state.files.splice(parseInt(this.dataset.idx), 1);
                self.renderList();
            });
        }

        document.getElementById('i2p-start').disabled = self.state.files.length === 0;
    },

    execute: function() {
        var self = this;
        var PDFDocument = PDFLib.PDFDocument;

        PDFDocument.create().then(function(doc) {
            var idx = 0;

            function addNext() {
                if (idx >= self.state.files.length) {
                    return doc.save().then(function(out) {
                        self.state.result = out;
                        document.getElementById('i2p-results').classList.add('visible');
                        Toast.success('PDF created from images');
                    });
                }

                var file = self.state.files[idx];

                return createImageBitmap(file).then(function(bmp) {
                    var c = document.createElement('canvas');
                    c.width = bmp.width;
                    c.height = bmp.height;
                    c.getContext('2d').drawImage(bmp, 0, 0);

                    var jpgBytes = Utils.dataUrlToBytes(c.toDataURL('image/jpeg', 0.92));

                    return doc.embedJpg(jpgBytes).then(function(img) {
                        var page = doc.addPage([img.width, img.height]);
                        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
                        idx++;
                        return addNext();
                    });
                });
            }

            return addNext();
        }).catch(function(err) {
            console.error(err);
            Toast.error('Failed: ' + err.message);
        });
    }
};