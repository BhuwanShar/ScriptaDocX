/* ================================================================
   Scripta — Text Cleaner
   ================================================================ */

var TextCleanTool = {
    id: 'textclean',
    name: 'Text Cleaner',
    description: 'Remove extra spaces, fix formatting, normalize text instantly',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
    category: 'text',
    state: {},

    render: function(container) {
        var self = this;

        container.innerHTML =
            '<div class="settings-card">' +
                '<div class="settings-card__title">Input Text</div>' +
                '<textarea id="tc-input" class="text-input" placeholder="Paste messy text here..." rows="8"></textarea>' +
            '</div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Cleaning Options</div>' +
                '<div class="setting-row"><div class="setting-row__label">Remove extra spaces</div><div class="setting-row__control"><select id="tc-spaces"><option value="yes" selected>Yes</option><option value="no">No</option></select></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Remove extra blank lines</div><div class="setting-row__control"><select id="tc-lines"><option value="yes" selected>Yes</option><option value="no">No</option></select></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Trim whitespace from lines</div><div class="setting-row__control"><select id="tc-trim"><option value="yes" selected>Yes</option><option value="no">No</option></select></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Fix double punctuation</div><div class="setting-row__control"><select id="tc-punct"><option value="yes" selected>Yes</option><option value="no">No</option></select></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Remove special characters</div><div class="setting-row__control"><select id="tc-special"><option value="no" selected>No</option><option value="yes">Yes</option></select></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Case conversion</div><div class="setting-row__control"><select id="tc-case"><option value="none" selected>None</option><option value="lower">lowercase</option><option value="upper">UPPERCASE</option><option value="title">Title Case</option><option value="sentence">Sentence case</option></select></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Remove URLs</div><div class="setting-row__control"><select id="tc-urls"><option value="no" selected>No</option><option value="yes">Yes</option></select></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Remove email addresses</div><div class="setting-row__control"><select id="tc-emails"><option value="no" selected>No</option><option value="yes">Yes</option></select></div></div>' +
                '<div class="setting-row"><div class="setting-row__label">Remove numbers</div><div class="setting-row__control"><select id="tc-numbers"><option value="no" selected>No</option><option value="yes">Yes</option></select></div></div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="tc-start">Clean Text</button>' +
            '<div class="results-card" id="tc-results">' +
                '<div class="results-card__title">Cleaned Text</div>' +
                '<div class="stats-grid" id="tc-stats"></div>' +
                '<div class="text-output" id="tc-output" style="margin-top:14px;"></div>' +
                '<div class="result-actions" style="margin-top:14px;">' +
                    '<button class="result-btn" id="tc-copy">Copy Cleaned Text</button>' +
                    '<button class="result-btn" id="tc-download">Download .txt</button>' +
                '</div>' +
            '</div>';

        document.getElementById('tc-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('tc-copy').addEventListener('click', function() {
            if (self.state.result) {
                navigator.clipboard.writeText(self.state.result);
                Toast.success('Copied');
            }
        });

        document.getElementById('tc-download').addEventListener('click', function() {
            if (self.state.result) {
                Utils.downloadBlob(new Blob([self.state.result], { type: 'text/plain' }), 'cleaned-text.txt');
            }
        });
    },

    execute: function() {
        var self = this;
        var text = document.getElementById('tc-input').value;

        if (!text.trim()) {
            Toast.error('Please enter some text');
            return;
        }

        var originalLen = text.length;
        var result = text;

        // Remove URLs
        if (document.getElementById('tc-urls').value === 'yes') {
            result = result.replace(/https?:\/\/[^\s]+/g, '');
        }

        // Remove emails
        if (document.getElementById('tc-emails').value === 'yes') {
            result = result.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '');
        }

        // Remove numbers
        if (document.getElementById('tc-numbers').value === 'yes') {
            result = result.replace(/\b\d+\.?\d*\b/g, '');
        }

        // Remove special characters
        if (document.getElementById('tc-special').value === 'yes') {
            result = result.replace(/[^a-zA-Z0-9\s.,!?;:'"()\-\n]/g, '');
        }

        // Fix double punctuation
        if (document.getElementById('tc-punct').value === 'yes') {
            result = result.replace(/([.!?,;:]){2,}/g, '$1');
            result = result.replace(/\s+([.!?,;:])/g, '$1');
        }

        // Remove extra spaces
        if (document.getElementById('tc-spaces').value === 'yes') {
            result = result.replace(/[^\S\n]+/g, ' ');
        }

        // Trim lines
        if (document.getElementById('tc-trim').value === 'yes') {
            result = result.split('\n').map(function(line) {
                return line.trim();
            }).join('\n');
        }

        // Remove extra blank lines
        if (document.getElementById('tc-lines').value === 'yes') {
            result = result.replace(/\n{3,}/g, '\n\n');
        }

        // Case conversion
        var caseOption = document.getElementById('tc-case').value;
        if (caseOption === 'lower') {
            result = result.toLowerCase();
        } else if (caseOption === 'upper') {
            result = result.toUpperCase();
        } else if (caseOption === 'title') {
            result = result.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        } else if (caseOption === 'sentence') {
            result = result.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, function(match, p1, p2) {
                return p1 + p2.toUpperCase();
            });
        }

        result = result.trim();
        self.state.result = result;

        var newLen = result.length;
        var removed = originalLen - newLen;
        var removedPct = originalLen > 0 ? ((removed / originalLen) * 100).toFixed(1) : '0';

        document.getElementById('tc-stats').innerHTML =
            '<div class="stat-box"><div class="stat-box__value">' + originalLen + '</div><div class="stat-box__label">Original Chars</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + newLen + '</div><div class="stat-box__label">Cleaned Chars</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + removedPct + '%</div><div class="stat-box__label">Removed</div></div>';

        document.getElementById('tc-output').textContent = result;
        document.getElementById('tc-results').classList.add('visible');
        Toast.success('Text cleaned');
    }
};