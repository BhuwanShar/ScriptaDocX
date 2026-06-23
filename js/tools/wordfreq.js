/* ================================================================
   Scripta — Word Frequency Analyzer with Charts
   ================================================================ */

var WordFreqTool = {
    id: 'wordfreq',
    name: 'Word Frequency',
    description: 'Analyze word frequency with bar charts, pie charts, and text statistics',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    category: 'text',
    state: {},

    stopwords: [
        'the','be','to','of','and','a','in','that','have','i','it','for',
        'not','on','with','he','as','you','do','at','this','but','his','by',
        'from','they','we','say','her','she','or','an','will','my','one',
        'all','would','there','their','what','so','up','out','if','about',
        'who','get','which','go','me','when','make','can','like','time','no',
        'just','him','know','take','people','into','year','your','good','some',
        'could','them','see','other','than','then','now','look','only','come',
        'its','over','think','also','back','after','use','two','how','our',
        'work','first','well','way','even','new','want','because','any',
        'these','give','day','most','us','is','are','was','were','been',
        'has','had','did','does','am','may','might','shall','should','must',
        'very','much','more','such','each','every','both','few','many',
        'own','same','too','said','also','where','why','still','here',
        'those','though','while','between','through','during','before',
        'without','again','further','then','once','above','below','been'
    ],

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div class="settings-card">' +
                '<div class="settings-card__title">Input</div>' +
                '<textarea id="wf-input" class="text-input" placeholder="Paste or type text here..." rows="8"></textarea>' +
            '</div>' +
            '<div id="wf-upload-wrap"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Options</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Remove stop words</div>' +
                    '<div class="setting-row__control"><select id="wf-stop"><option value="yes" selected>Yes</option><option value="no">No</option></select></div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Min word length</div>' +
                    '<div class="setting-row__control"><select id="wf-minlen"><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option><option value="5">5</option></select></div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Show top N words</div>' +
                    '<div class="setting-row__control"><select id="wf-topn"><option value="10">10</option><option value="20" selected>20</option><option value="30">30</option><option value="50">50</option></select></div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Chart type</div>' +
                    '<div class="setting-row__control"><select id="wf-chart"><option value="bar" selected>Bar Chart</option><option value="horizontal">Horizontal Bar</option><option value="pie">Pie Chart</option></select></div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="wf-start">Analyze</button>' +
            '<div class="results-card" id="wf-results">' +
                '<div class="results-card__title">Results</div>' +
                '<div class="stats-grid" id="wf-stats"></div>' +
                '<div class="chart-container" id="wf-chart-wrap" style="margin:18px 0;">' +
                    '<canvas id="wf-canvas" style="width:100%;"></canvas>' +
                '</div>' +
                '<div class="settings-card__title" style="margin-bottom:10px;">Word List</div>' +
                '<div id="wf-bars"></div>' +
                '<div class="result-actions" style="margin-top:14px;">' +
                    '<button class="result-btn" id="wf-dl-csv">Download CSV</button>' +
                    '<button class="result-btn" id="wf-dl-chart">Download Chart</button>' +
                    '<button class="result-btn" id="wf-copy">Copy Results</button>' +
                '</div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('wf-upload-wrap'), '.txt,.pdf,.html,.md', function(file) {
            if (file.type === 'application/pdf') {
                file.arrayBuffer().then(function(bytes) {
                    return pdfjsLib.getDocument({ data: bytes }).promise;
                }).then(function(doc) {
                    var allText = '';
                    function nextPage(i) {
                        if (i > doc.numPages) {
                            document.getElementById('wf-input').value = allText.trim();
                            Toast.success('Extracted text from PDF');
                            return;
                        }
                        doc.getPage(i).then(function(p) {
                            return p.getTextContent();
                        }).then(function(c) {
                            allText += c.items.map(function(x) { return x.str; }).join(' ') + '\n';
                            nextPage(i + 1);
                        });
                    }
                    nextPage(1);
                });
            } else {
                var reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('wf-input').value = e.target.result;
                    Toast.success('Loaded: ' + file.name);
                };
                reader.readAsText(file);
            }
        });

        document.getElementById('wf-chart').addEventListener('change', function() {
            if (self.state.topWords) self.drawChart(self.state.topWords, self.state.totalWords);
        });

        document.getElementById('wf-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('wf-copy').addEventListener('click', function() {
            if (self.state.resultText) { navigator.clipboard.writeText(self.state.resultText); Toast.success('Copied'); }
        });

        document.getElementById('wf-dl-csv').addEventListener('click', function() {
            if (self.state.csv) Utils.downloadBlob(new Blob([self.state.csv], { type: 'text/csv' }), 'word-frequency.csv');
        });

        document.getElementById('wf-dl-chart').addEventListener('click', function() {
            var canvas = document.getElementById('wf-canvas');
            if (canvas) {
                canvas.toBlob(function(blob) { Utils.downloadBlob(blob, 'word-frequency-chart.png'); });
            }
        });
    },

    execute: function() {
        var self = this;
        var text = document.getElementById('wf-input').value;
        if (!text.trim()) { Toast.error('Please enter some text'); return; }

        var removeStop = document.getElementById('wf-stop').value === 'yes';
        var minLen = parseInt(document.getElementById('wf-minlen').value);
        var topN = parseInt(document.getElementById('wf-topn').value);

        var words = text.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/).filter(function(w) {
            if (w.length < minLen) return false;
            if (removeStop && self.stopwords.indexOf(w) !== -1) return false;
            return true;
        });

        var freq = {};
        words.forEach(function(w) { freq[w] = (freq[w] || 0) + 1; });

        var sorted = Object.keys(freq).map(function(w) {
            return { word: w, count: freq[w] };
        }).sort(function(a, b) { return b.count - a.count; });

        var topWords = sorted.slice(0, topN);
        var totalWords = words.length;
        var uniqueWords = sorted.length;
        var charCount = text.length;
        var sentences = (text.match(/[.!?]+/g) || []).length || 1;
        var avgWordLen = totalWords > 0 ? (words.reduce(function(s, w) { return s + w.length; }, 0) / totalWords).toFixed(1) : 0;
        var lexicalDiversity = totalWords > 0 ? ((uniqueWords / totalWords) * 100).toFixed(1) : 0;

        self.state.topWords = topWords;
        self.state.totalWords = totalWords;

        document.getElementById('wf-stats').innerHTML =
            '<div class="stat-box"><div class="stat-box__value">' + totalWords + '</div><div class="stat-box__label">Total Words</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + uniqueWords + '</div><div class="stat-box__label">Unique Words</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + charCount + '</div><div class="stat-box__label">Characters</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + sentences + '</div><div class="stat-box__label">Sentences</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + avgWordLen + '</div><div class="stat-box__label">Avg Word Len</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + lexicalDiversity + '%</div><div class="stat-box__label">Lex. Diversity</div></div>';

        self.drawChart(topWords, totalWords);
        self.renderBars(topWords, totalWords);

        // CSV and copy text
        self.state.csv = 'Rank,Word,Count,Percentage\n' + topWords.map(function(w, i) {
            return (i + 1) + ',"' + w.word + '",' + w.count + ',' + ((w.count / totalWords) * 100).toFixed(2);
        }).join('\n');

        self.state.resultText = 'Word Frequency Analysis\n---\nTotal: ' + totalWords + ' | Unique: ' + uniqueWords + '\n\n' +
            topWords.map(function(w, i) { return (i + 1) + '. ' + w.word + ' — ' + w.count; }).join('\n');

        document.getElementById('wf-results').classList.add('visible');
        Toast.success('Analysis complete');
    },

    drawChart: function(topWords, totalWords) {
        var self = this;
        var type = document.getElementById('wf-chart').value;
        var canvas = document.getElementById('wf-canvas');
        var container = document.getElementById('wf-chart-wrap');
        var W = container.offsetWidth || 600;
        var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        var textColor = isDark ? '#9494a0' : '#55555f';
        var gridColor = isDark ? '#1e1e26' : '#eaebef';
        var bgColor = isDark ? '#111114' : '#ffffff';

        var palette = [
            '#6c63ff','#f7436d','#22c55e','#eab308','#3b82f6',
            '#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4',
            '#84cc16','#ef4444','#a78bfa','#fb923c','#34d399',
            '#fbbf24','#60a5fa','#f472b6','#4ade80','#facc15'
        ];

        if (type === 'bar') {
            var display = topWords.slice(0, 15);
            var H = 340;
            canvas.width = W;
            canvas.height = H;
            canvas.style.height = H + 'px';
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, W, H);

            var padL = 50, padR = 20, padT = 20, padB = 60;
            var chartW = W - padL - padR;
            var chartH = H - padT - padB;
            var maxCount = display[0].count;
            var barW = (chartW / display.length) * 0.65;
            var gap = (chartW / display.length) * 0.35;

            // Grid lines
            var steps = 5;
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            for (var g = 0; g <= steps; g++) {
                var y = padT + chartH - (g / steps) * chartH;
                ctx.beginPath();
                ctx.moveTo(padL, y);
                ctx.lineTo(padL + chartW, y);
                ctx.stroke();
                ctx.fillStyle = textColor;
                ctx.font = '10px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(Math.round((g / steps) * maxCount), padL - 6, y + 4);
            }
            ctx.setLineDash([]);

            // Bars
            for (var b = 0; b < display.length; b++) {
                var bH = (display[b].count / maxCount) * chartH;
                var bX = padL + b * (chartW / display.length) + gap / 2;
                var bY = padT + chartH - bH;

                ctx.fillStyle = palette[b % palette.length];
                ctx.globalAlpha = 0.9;
                // Rounded top
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

                // Count label on top
                ctx.fillStyle = textColor;
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(display[b].count, bX + barW / 2, bY - 4);

                // Word label on bottom
                ctx.save();
                ctx.translate(bX + barW / 2, padT + chartH + 8);
                ctx.rotate(-Math.PI / 4);
                ctx.font = '10px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillStyle = textColor;
                ctx.fillText(display[b].word, 0, 0);
                ctx.restore();
            }

        } else if (type === 'horizontal') {
            var display = topWords.slice(0, 15);
            var rowH = 28;
            var H = padT + display.length * rowH + 30;
            var padL = 120, padR = 60, padT = 20;
            canvas.width = W;
            canvas.height = H;
            canvas.style.height = H + 'px';
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, W, H);
            var chartW = W - padL - padR;
            var maxCount = display[0].count;

            for (var b = 0; b < display.length; b++) {
                var bW = (display[b].count / maxCount) * chartW;
                var bY = padT + b * rowH;
                var bH = rowH * 0.6;

                ctx.fillStyle = palette[b % palette.length];
                ctx.globalAlpha = 0.85;
                var r = 3;
                ctx.beginPath();
                ctx.moveTo(padL, bY + r);
                ctx.quadraticCurveTo(padL, bY, padL + r, bY);
                ctx.lineTo(padL + bW - r, bY);
                ctx.quadraticCurveTo(padL + bW, bY, padL + bW, bY + r);
                ctx.lineTo(padL + bW, bY + bH - r);
                ctx.quadraticCurveTo(padL + bW, bY + bH, padL + bW - r, bY + bH);
                ctx.lineTo(padL + r, bY + bH);
                ctx.quadraticCurveTo(padL, bY + bH, padL, bY + bH - r);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;

                // Word label
                ctx.fillStyle = textColor;
                ctx.font = '11px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(display[b].word, padL - 8, bY + bH / 2 + 4);

                // Count
                ctx.textAlign = 'left';
                ctx.fillText(display[b].count + ' (' + ((display[b].count / totalWords) * 100).toFixed(1) + '%)', padL + bW + 6, bY + bH / 2 + 4);
            }

        } else if (type === 'pie') {
            var display = topWords.slice(0, 10);
            var size = Math.min(W, 360);
            var H = size + 180;
            canvas.width = W;
            canvas.height = H;
            canvas.style.height = H + 'px';
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, W, H);
            var cx = W / 2, cy = size / 2;
            var radius = (size / 2) - 20;
            var topTotal = display.reduce(function(s, w) { return s + w.count; }, 0);
            var angle = -Math.PI / 2;

            // Draw slices
            for (var s = 0; s < display.length; s++) {
                var slice = (display[s].count / topTotal) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, angle, angle + slice);
                ctx.closePath();
                ctx.fillStyle = palette[s % palette.length];
                ctx.fill();
                ctx.strokeStyle = bgColor;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Percentage label on slice
                var labelAngle = angle + slice / 2;
                var lx = cx + Math.cos(labelAngle) * (radius * 0.65);
                var ly = cy + Math.sin(labelAngle) * (radius * 0.65);
                var pct = ((display[s].count / topTotal) * 100).toFixed(1);
                if (parseFloat(pct) > 4) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(pct + '%', lx, ly);
                }
                angle += slice;
            }

            // Donut hole
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = bgColor;
            ctx.fill();

            // Legend
            var cols = 2;
            var legendY = size + 10;
            var colW = W / cols;
            for (var l = 0; l < display.length; l++) {
                var lCol = l % cols;
                var lRow = Math.floor(l / cols);
                var lX = lCol * colW + 16;
                var lY = legendY + lRow * 20;

                ctx.fillStyle = palette[l % palette.length];
                ctx.fillRect(lX, lY, 10, 10);

                ctx.fillStyle = textColor;
                ctx.font = '11px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                var pct = ((display[l].count / topTotal) * 100).toFixed(1);
                ctx.fillText(display[l].word + ' (' + pct + '%)', lX + 14, lY + 9);
            }
        }
    },

    renderBars: function(topWords, totalWords) {
        var max = topWords.length > 0 ? topWords[0].count : 1;
        var html = '';
        var palette = [
            '#6c63ff','#f7436d','#22c55e','#eab308','#3b82f6',
            '#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4'
        ];
        for (var i = 0; i < topWords.length; i++) {
            var pct = Math.round((topWords[i].count / max) * 100);
            var freqPct = ((topWords[i].count / totalWords) * 100).toFixed(1);
            html += '<div class="freq-bar-row">' +
                '<span class="freq-bar-rank">' + (i + 1) + '</span>' +
                '<span class="freq-bar-word">' + topWords[i].word + '</span>' +
                '<div class="freq-bar-track"><div class="freq-bar-fill" style="width:' + pct + '%;background:' + palette[i % palette.length] + '"></div></div>' +
                '<span class="freq-bar-count">' + topWords[i].count + ' <small>(' + freqPct + '%)</small></span>' +
            '</div>';
        }
        document.getElementById('wf-bars').innerHTML = html;
    },

    countSyllables: function(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        var m = word.match(/[aeiouy]{1,2}/g);
        return m ? m.length : 1;
    }
};