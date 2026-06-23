/* ================================================================
   Scripta — TF-IDF Analyzer
   ================================================================ */

var TFIDFTool = {
    id: 'tfidf',
    name: 'TF-IDF Analyzer',
    description: 'Score and rank keywords by importance using Term Frequency-Inverse Document Frequency',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    category: 'text',
    state: {},

    stopwords: [
        'the','be','to','of','and','a','in','that','have','i','it','for',
        'not','on','with','he','as','you','do','at','this','but','his','by',
        'from','they','we','say','her','she','or','an','will','my','one',
        'all','would','there','their','what','so','up','out','if','about',
        'who','get','which','go','me','when','make','can','like','time','no',
        'just','him','know','take','people','into','your','some','could',
        'them','see','other','than','then','now','look','only','come','its',
        'over','think','also','back','after','use','how','our','work','well',
        'way','even','new','want','because','any','these','give','day',
        'most','us','is','are','was','were','been','has','had','did','does',
        'am','may','might','shall','should','must','very','much','more',
        'such','each','every','both','few','many','own','same','too'
    ],

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div class="settings-card">' +
                '<div class="settings-card__title">Documents</div>' +
                '<p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;">TF-IDF requires multiple documents. Separate documents using a blank line between paragraphs, or add multiple documents below.</p>' +
                '<textarea id="tfidf-input" class="text-input" placeholder="Document 1...\n\nDocument 2...\n\nDocument 3..." rows="10"></textarea>' +
            '</div>' +
            '<div id="tfidf-upload-wrap"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Options</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Split documents by</div>' +
                    '<div class="setting-row__control">' +
                        '<select id="tfidf-split">' +
                            '<option value="paragraph" selected>Blank line (paragraphs)</option>' +
                            '<option value="sentence">Sentences</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Remove stop words</div>' +
                    '<div class="setting-row__control"><select id="tfidf-stop"><option value="yes" selected>Yes</option><option value="no">No</option></select></div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Top keywords per document</div>' +
                    '<div class="setting-row__control"><select id="tfidf-topn"><option value="5">5</option><option value="10" selected>10</option><option value="15">15</option></select></div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Chart type</div>' +
                    '<div class="setting-row__control">' +
                        '<select id="tfidf-chart">' +
                            '<option value="heatmap" selected>Score Heatmap</option>' +
                            '<option value="bar">Bar Chart (top doc)</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="tfidf-start">Run TF-IDF</button>' +
            '<div class="results-card" id="tfidf-results">' +
                '<div class="results-card__title">TF-IDF Results</div>' +
                '<div class="stats-grid" id="tfidf-stats"></div>' +
                '<div class="chart-container" style="margin:18px 0;overflow-x:auto;">' +
                    '<canvas id="tfidf-canvas"></canvas>' +
                '</div>' +
                '<div id="tfidf-tables"></div>' +
                '<div class="result-actions" style="margin-top:14px;">' +
                    '<button class="result-btn" id="tfidf-dl-csv">Download CSV</button>' +
                    '<button class="result-btn" id="tfidf-dl-chart">Download Chart</button>' +
                '</div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('tfidf-upload-wrap'), '.txt,.pdf', function(file) {
            if (file.type === 'application/pdf') {
                file.arrayBuffer().then(function(bytes) {
                    return pdfjsLib.getDocument({ data: bytes }).promise;
                }).then(function(doc) {
                    var pages = [];
                    function nextPage(i) {
                        if (i > doc.numPages) {
                            document.getElementById('tfidf-input').value = pages.join('\n\n');
                            Toast.success('Loaded PDF — each page = one document');
                            return;
                        }
                        doc.getPage(i).then(function(p) { return p.getTextContent(); }).then(function(c) {
                            pages.push(c.items.map(function(x) { return x.str; }).join(' '));
                            nextPage(i + 1);
                        });
                    }
                    nextPage(1);
                });
            } else {
                var reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('tfidf-input').value = e.target.result;
                    Toast.success('Loaded: ' + file.name);
                };
                reader.readAsText(file);
            }
        });

        document.getElementById('tfidf-chart').addEventListener('change', function() {
            if (self.state.results) self.drawChart(self.state.results);
        });

        document.getElementById('tfidf-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('tfidf-dl-csv').addEventListener('click', function() {
            if (self.state.csv) Utils.downloadBlob(new Blob([self.state.csv], { type: 'text/csv' }), 'tfidf.csv');
        });

        document.getElementById('tfidf-dl-chart').addEventListener('click', function() {
            var canvas = document.getElementById('tfidf-canvas');
            if (canvas) canvas.toBlob(function(blob) { Utils.downloadBlob(blob, 'tfidf-chart.png'); });
        });
    },

    tokenize: function(text, removeStop) {
        var self = this;
        return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function(w) {
            if (w.length < 3) return false;
            if (removeStop && self.stopwords.indexOf(w) !== -1) return false;
            return true;
        });
    },

    execute: function() {
        var self = this;
        var raw = document.getElementById('tfidf-input').value;
        if (!raw.trim()) { Toast.error('Please enter text'); return; }

        var splitBy = document.getElementById('tfidf-split').value;
        var removeStop = document.getElementById('tfidf-stop').value === 'yes';
        var topN = parseInt(document.getElementById('tfidf-topn').value);

        // Split into documents
        var rawDocs;
        if (splitBy === 'paragraph') {
            rawDocs = raw.split(/\n\s*\n/).filter(function(d) { return d.trim().length > 20; });
        } else {
            rawDocs = raw.match(/[^.!?]+[.!?]+/g) || [raw];
            rawDocs = rawDocs.filter(function(d) { return d.trim().length > 10; });
        }

        if (rawDocs.length < 2) {
            Toast.error('Need at least 2 documents / paragraphs / sentences');
            return;
        }

        // Limit to 20 docs for performance
        rawDocs = rawDocs.slice(0, 20);

        // Tokenize
        var tokenizedDocs = rawDocs.map(function(doc) {
            return self.tokenize(doc, removeStop);
        });

        var N = tokenizedDocs.length;

        // Build vocabulary
        var vocab = {};
        tokenizedDocs.forEach(function(doc) {
            doc.forEach(function(word) { vocab[word] = true; });
        });
        var allWords = Object.keys(vocab);

        // TF: term frequency per doc
        function tf(doc, term) {
            var count = doc.filter(function(w) { return w === term; }).length;
            return doc.length > 0 ? count / doc.length : 0;
        }

        // IDF: inverse document frequency
        function idf(term) {
            var docsWithTerm = tokenizedDocs.filter(function(doc) {
                return doc.indexOf(term) !== -1;
            }).length;
            return docsWithTerm > 0 ? Math.log((N + 1) / (docsWithTerm + 1)) + 1 : 0;
        }

        // Compute TF-IDF per doc
        var results = tokenizedDocs.map(function(doc, di) {
            var scores = {};
            var uniqueInDoc = {};
            doc.forEach(function(w) { uniqueInDoc[w] = true; });

            Object.keys(uniqueInDoc).forEach(function(term) {
                scores[term] = tf(doc, term) * idf(term);
            });

            var sorted = Object.keys(scores).map(function(w) {
                return { word: w, score: scores[w], tf: tf(doc, w), idf: idf(w) };
            }).sort(function(a, b) { return b.score - a.score; });

            return {
                label: 'Doc ' + (di + 1),
                text: rawDocs[di].substring(0, 60) + '...',
                top: sorted.slice(0, topN),
                all: scores
            };
        });

        self.state.results = results;
        self.state.topN = topN;

        // Stats
        document.getElementById('tfidf-stats').innerHTML =
            '<div class="stat-box"><div class="stat-box__value">' + N + '</div><div class="stat-box__label">Documents</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + allWords.length + '</div><div class="stat-box__label">Vocabulary</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + topN + '</div><div class="stat-box__label">Top Terms</div></div>';

        self.drawChart(results);
        self.renderTables(results);

        // CSV
        var csvRows = ['Document,Rank,Word,TF-IDF Score,TF,IDF'];
        results.forEach(function(doc) {
            doc.top.forEach(function(w, i) {
                csvRows.push([
                    '"' + doc.label + '"',
                    i + 1,
                    '"' + w.word + '"',
                    w.score.toFixed(4),
                    w.tf.toFixed(4),
                    w.idf.toFixed(4)
                ].join(','));
            });
        });
        self.state.csv = csvRows.join('\n');

        document.getElementById('tfidf-results').classList.add('visible');
        Toast.success('TF-IDF complete — ' + N + ' documents analyzed');
    },

    drawChart: function(results) {
        var type = document.getElementById('tfidf-chart').value;
        var canvas = document.getElementById('tfidf-canvas');
        var container = canvas.parentElement;
        var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        var textColor = isDark ? '#9494a0' : '#55555f';
        var bgColor = isDark ? '#111114' : '#ffffff';
        var borderColor = isDark ? '#1e1e26' : '#eaebef';

        var palette = ['#6c63ff','#f7436d','#22c55e','#eab308','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4'];

        if (type === 'heatmap') {
            // Collect all top words across docs
            var topWordSet = {};
            results.forEach(function(doc) {
                doc.top.forEach(function(w) { topWordSet[w.word] = true; });
            });
            var heatWords = Object.keys(topWordSet).slice(0, 15);

            var cellW = 70;
            var cellH = 28;
            var labelW = 90;
            var labelH = 50;
            var W = Math.max(container.offsetWidth, labelW + heatWords.length * cellW + 20);
            var H = labelH + results.length * cellH + 10;

            canvas.width = W;
            canvas.height = H;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';

            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, W, H);

            // Find max score for color normalization
            var maxScore = 0;
            results.forEach(function(doc) {
                doc.top.forEach(function(w) { if (w.score > maxScore) maxScore = w.score; });
            });

            // Column headers (words)
            ctx.fillStyle = textColor;
            ctx.font = '10px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            heatWords.forEach(function(word, ci) {
                ctx.save();
                ctx.translate(labelW + ci * cellW + cellW / 2, labelH - 16);
                ctx.rotate(-Math.PI / 4);
                ctx.fillText(word, 0, 0);
                ctx.restore();
            });

            // Rows (documents)
            results.forEach(function(doc, ri) {
                // Row label
                ctx.fillStyle = textColor;
                ctx.textAlign = 'right';
                ctx.font = '10px -apple-system, sans-serif';
                ctx.fillText(doc.label, labelW - 6, labelH + ri * cellH + cellH / 2 + 4);

                heatWords.forEach(function(word, ci) {
                    var score = doc.all[word] || 0;
                    var intensity = maxScore > 0 ? score / maxScore : 0;
                    var alpha = 0.05 + intensity * 0.85;

                    ctx.fillStyle = 'rgba(108, 99, 255, ' + alpha + ')';
                    ctx.fillRect(labelW + ci * cellW, labelH + ri * cellH, cellW - 2, cellH - 2);

                    if (intensity > 0.1) {
                        ctx.fillStyle = intensity > 0.5 ? '#fff' : textColor;
                        ctx.font = '9px -apple-system, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(score.toFixed(2), labelW + ci * cellW + cellW / 2, labelH + ri * cellH + cellH / 2 + 4);
                    }
                });
            });

        } else if (type === 'bar') {
            var doc = results[0];
            var display = doc.top;
            var W = Math.max(container.offsetWidth, 400);
            var H = 320;
            canvas.width = W;
            canvas.height = H;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';

            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, W, H);

            var padL = 50, padR = 20, padT = 30, padB = 70;
            var chartW = W - padL - padR;
            var chartH = H - padT - padB;
            var maxScore = display[0].score;
            var barW = (chartW / display.length) * 0.65;
            var gap = (chartW / display.length) * 0.35;

            // Title
            ctx.fillStyle = textColor;
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('TF-IDF Scores — Doc 1 (Top Keywords)', W / 2, 16);

            // Grid
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            for (var g = 0; g <= 5; g++) {
                var y = padT + chartH - (g / 5) * chartH;
                ctx.beginPath();
                ctx.moveTo(padL, y);
                ctx.lineTo(padL + chartW, y);
                ctx.stroke();
                ctx.fillStyle = textColor;
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(((g / 5) * maxScore).toFixed(2), padL - 4, y + 3);
            }
            ctx.setLineDash([]);

            // Bars
            for (var b = 0; b < display.length; b++) {
                var bH = (display[b].score / maxScore) * chartH;
                var bX = padL + b * (chartW / display.length) + gap / 2;
                var bY = padT + chartH - bH;

                ctx.fillStyle = palette[b % palette.length];
                ctx.globalAlpha = 0.88;
                var r = Math.min(4, barW / 2);
                ctx.beginPath();
                ctx.moveTo(bX + r, bY);
                ctx.lineTo(bX + barW - r, bY);
                ctx.quadraticCurveTo(bX + barW, bY, bX + barW, bY + r);
                ctx.lineTo(bX + barW, padT + chartH);
                ctx.lineTo(bX, padT + chartH);
                ctx.lineTo(bX, bY + r);
                ctx.quadraticCurveTo(bX, bY, bX + r, bY);
                ctx.fill();
                ctx.globalAlpha = 1;

                ctx.fillStyle = textColor;
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(display[b].score.toFixed(3), bX + barW / 2, bY - 4);

                ctx.save();
                ctx.translate(bX + barW / 2, padT + chartH + 8);
                ctx.rotate(-Math.PI / 4);
                ctx.textAlign = 'right';
                ctx.fillText(display[b].word, 0, 0);
                ctx.restore();
            }
        }
    },

    renderTables: function(results) {
        var html = '';
        results.forEach(function(doc) {
            html += '<div class="settings-card" style="margin-bottom:10px;">' +
                '<div class="settings-card__title">' + doc.label + ' — ' + doc.text + '</div>' +
                '<table class="tfidf-table">' +
                    '<thead><tr><th>Rank</th><th>Word</th><th>TF-IDF</th><th>TF</th><th>IDF</th></tr></thead>' +
                    '<tbody>' +
                    doc.top.map(function(w, i) {
                        return '<tr>' +
                            '<td>' + (i + 1) + '</td>' +
                            '<td><strong>' + w.word + '</strong></td>' +
                            '<td>' + w.score.toFixed(4) + '</td>' +
                            '<td>' + w.tf.toFixed(4) + '</td>' +
                            '<td>' + w.idf.toFixed(4) + '</td>' +
                        '</tr>';
                    }).join('') +
                    '</tbody>' +
                '</table>' +
            '</div>';
        });
        document.getElementById('tfidf-tables').innerHTML = html;
    }
};