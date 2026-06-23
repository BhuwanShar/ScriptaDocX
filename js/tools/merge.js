/* ================================================================
   Scripta — Merge PDFs
   ================================================================ */

var MergeTool = {
    id: 'merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDF files into a single document',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="8" height="14" rx="1"/><rect x="14" y="3" width="8" height="14" rx="1"/><path d="M10 14h4"/></svg>',
    category: 'pdf',
    state: { files: [] },

    render: function(container) {
        var self = this;
        self.state = { files: [], result: null };

        container.innerHTML =
            '<label class="multi-upload-btn" for="merge-input">+ Add PDF Files</label>' +
            '<input type="file" id="merge-input" accept=".pdf" multiple style="display:none">' +
            '<div class="file-list" id="merge-list"></div>' +
            '<button class="action-btn action-btn--primary" id="merge-start" disabled>Merge PDFs</button>' +
            '<div class="progress-section" id="merge-progress">' +
                '<div class="progress-track"><div class="progress-fill" id="merge-fill"></div></div>' +
                '<div class="progress-meta"><span id="merge-status">Merging...</span><span id="merge-percent">0%</span></div>' +
            '</div>' +
            '<div class="results-card" id="merge-results">' +
                '<div class="results-card__title">PDFs Merged Successfully</div>' +
                '<div class="result-actions"><button class="result-btn" id="merge-download">Download Merged PDF</button></div>' +
            '</div>';

        document.getElementById('merge-input').addEventListener('change', function(e) {
            var promises = [];
            for (var i = 0; i < e.target.files.length; i++) {
                (function(file) {
                    promises.push(file.arrayBuffer().then(function(bytes) {
                        self.state.files.push({ name: file.name, size: file.size, bytes: bytes });
                    }));
                })(e.target.files[i]);
            }
            Promise.all(promises).then(function() {
                self.renderList();
            });
            e.target.value = '';
        });

        document.getElementById('merge-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('merge-download').addEventListener('click', function() {
            if (self.state.result) {
                Utils.downloadBlob(new Blob([self.state.result], { type: 'application/pdf' }), 'merged.pdf');
            }
        });
    },

    renderList: function() {
        var self = this;
        var list = document.getElementById('merge-list');
        list.innerHTML = '';

        self.state.files.forEach(function(f, i) {
            var item = document.createElement('div');
            item.className = 'file-list-item';
            item.innerHTML =
                '<div class="file-list-item__info"><span>' + f.name + ' (' + Utils.formatBytes(f.size) + ')</span></div>' +
                '<button class="file-list-item__remove" data-idx="' + i + '">\u00D7</button>';
            list.appendChild(item);
        });

        var removeBtns = list.querySelectorAll('.file-list-item__remove');
        for (var r = 0; r < removeBtns.length; r++) {
            removeBtns[r].addEventListener('click', function() {
                self.state.files.splice(parseInt(this.dataset.idx), 1);
                self.renderList();
            });
        }

        document.getElementById('merge-start').disabled = self.state.files.length < 2;
    },

    execute: function() {
        var self = this;
        var btn = document.getElementById('merge-start');
        var fill = document.getElementById('merge-fill');
        var status = document.getElementById('merge-status');

        btn.disabled = true;
        document.getElementById('merge-progress').classList.add('visible');
        document.getElementById('merge-results').classList.remove('visible');

        var PDFDocument = PDFLib.PDFDocument;

        PDFDocument.create().then(function(merged) {
            var idx = 0;

            function mergeNext() {
                if (idx >= self.state.files.length) {
                    return merged.save().then(function(out) {
                        self.state.result = out;
                        document.getElementById('merge-results').classList.add('visible');
                        status.textContent = 'Complete';
                        Toast.success('PDFs merged');
                        btn.disabled = false;
                    });
                }

                status.textContent = 'Merging file ' + (idx + 1) + ' of ' + self.state.files.length + '...';
                fill.style.width = Math.round(((idx + 1) / self.state.files.length) * 100) + '%';

                return PDFDocument.load(self.state.files[idx].bytes).then(function(src) {
                    return merged.copyPages(src, src.getPageIndices());
                }).then(function(pages) {
                    pages.forEach(function(p) { merged.addPage(p); });
                    idx++;
                    return mergeNext();
                });
            }

            return mergeNext();
        }).catch(function(err) {
            console.error(err);
            status.textContent = 'Error: ' + err.message;
            Toast.error('Merge failed');
            btn.disabled = false;
        });
    }
};