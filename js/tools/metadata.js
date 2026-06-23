/* ================================================================
   Scripta — Edit Metadata
   ================================================================ */

var MetadataTool = {
    id: 'metadata',
    name: 'Edit Metadata',
    description: 'View and modify PDF title, author, subject, and keywords',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    category: 'pdf',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div id="meta-upload"></div>' +
            '<div class="settings-card" id="meta-fields" style="display:none">' +
                '<div class="settings-card__title">PDF Metadata</div>' +
                '<div class="setting-row"><div class="setting-row__label">Title</div><div class="setting-row__control"><input type="text" id="meta-title" style="width:200px"></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Author</div><div class="setting-row__control"><input type="text" id="meta-author" style="width:200px"></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Subject</div><div class="setting-row__control"><input type="text" id="meta-subject" style="width:200px"></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Keywords</div><div class="setting-row__control"><input type="text" id="meta-keywords" placeholder="comma separated" style="width:200px"></div></div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="meta-start" disabled>Save Metadata</button>' +
            '<div class="results-card" id="meta-results">' +
                '<div class="results-card__title">Metadata Updated</div>' +
                '<div class="result-actions"><button class="result-btn" id="meta-download">Download PDF</button></div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('meta-upload'), '.pdf', function(file) {
            self.state.file = file;
            file.arrayBuffer().then(function(bytes) {
                self.state.bytes = bytes;
                return PDFLib.PDFDocument.load(bytes);
            }).then(function(doc) {
                document.getElementById('meta-title').value = doc.getTitle() || '';
                document.getElementById('meta-author').value = doc.getAuthor() || '';
                document.getElementById('meta-subject').value = doc.getSubject() || '';
                document.getElementById('meta-keywords').value = doc.getKeywords() || '';
                document.getElementById('meta-fields').style.display = 'block';
                document.getElementById('meta-start').disabled = false;
            });
        });

        document.getElementById('meta-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('meta-download').addEventListener('click', function() {
            if (self.state.result) Utils.downloadBlob(new Blob([self.state.result], { type: 'application/pdf' }), self.state.file.name.replace('.pdf', '-metadata.pdf'));
        });
    },

    execute: function() {
        var self = this;

        PDFLib.PDFDocument.load(self.state.bytes).then(function(doc) {
            doc.setTitle(document.getElementById('meta-title').value);
            doc.setAuthor(document.getElementById('meta-author').value);
            doc.setSubject(document.getElementById('meta-subject').value);
            doc.setKeywords(document.getElementById('meta-keywords').value.split(',').map(function(s) { return s.trim(); }));
            doc.setModificationDate(new Date());
            doc.setProducer('Scripta by Bhuwan Sharma');
            return doc.save();
        }).then(function(out) {
            self.state.result = out;
            document.getElementById('meta-results').classList.add('visible');
            Toast.success('Metadata updated');
        }).catch(function(err) {
            console.error(err);
            Toast.error('Failed to update metadata');
        });
    }
};