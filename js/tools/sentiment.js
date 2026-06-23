/* ================================================================
   Scripta — Sentiment Analysis with Chart
   ================================================================ */

var SentimentTool = {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Detect emotional tone with sentence-level timeline and score breakdown',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    category: 'text',
    state: {},

    lexicon: {
        'outstanding':5,'excellent':5,'superb':5,'amazing':5,'wonderful':5,'fantastic':5,
        'brilliant':5,'exceptional':5,'magnificent':5,'perfect':5,'great':3,'good':3,
        'happy':3,'love':3,'like':2,'best':3,'beautiful':3,'nice':2,'awesome':4,
        'enjoy':2,'glad':3,'pleased':2,'helpful':2,'impressive':3,'incredible':4,
        'remarkable':3,'delightful':3,'pleasant':2,'exciting':3,'innovative':2,
        'efficient':2,'elegant':3,'reliable':2,'comfortable':2,'creative':2,
        'positive':2,'success':2,'successful':3,'win':3,'winning':3,'benefit':2,
        'fun':3,'joy':3,'grateful':3,'thank':2,'thanks':2,'appreciate':2,
        'valuable':2,'inspire':3,'inspired':3,'proud':3,'ok':1,'okay':1,
        'fine':1,'decent':1,'fair':1,'adequate':1,'acceptable':1,'reasonable':1,
        'bad':-3,'poor':-2,'boring':-2,'problem':-2,'issue':-1,'concern':-1,
        'worry':-2,'confusing':-2,'confused':-2,'annoying':-2,'disappointed':-2,
        'unfortunately':-2,'lack':-2,'wrong':-2,'error':-2,'mistake':-2,
        'fail':-2,'failure':-3,'ugly':-3,'waste':-2,'useless':-3,'broken':-2,
        'frustrating':-3,'frustrated':-2,'terrible':-4,'horrible':-4,'awful':-4,
        'worst':-5,'hate':-4,'disgusting':-4,'dreadful':-4,'pathetic':-4,
        'disaster':-4,'nightmare':-4,'toxic':-3,'scam':-4,'fraud':-4,
        'dangerous':-3,'angry':-3,'furious':-4,'rage':-4,'destroy':-3
    },

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div class="settings-card">' +
                '<div class="settings-card__title">Input Text</div>' +
                '<textarea id="sa-input" class="text-input" placeholder="Paste text to analyze sentiment..." rows="8"></textarea>' +
            '</div>' +
            '<div id="sa-upload-wrap"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Chart</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Chart type</div>' +
                    '<div class="setting-row__control">' +
                        '<select id="sa-chart">' +
                            '<option value="timeline" selected>Sentiment Timeline</option>' +
                            '<option value="distribution">Score Distribution</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="sa-start">Analyze Sentiment</button>' +
            '<div class="results-card" id="sa-results">' +
                '<div class="results-card__title">Sentiment Results</div>' +
                '<div class="sentiment-gauge" id="sa-gauge"></div>' +
                '<div class="stats-grid" id="sa-stats"></div>' +
                '<div class="chart-container" style="margin:18px 0;">' +
                    '<canvas id="sa-canvas" style="width:100%;"></canvas>' +
                '</div>' +
                '<div class="settings-card__title" style="margin:14px 0 10px;">Sentence Breakdown</div>' +
                '<div id="sa-sentences" class="text-output" style="max-height:280px;"></div>' +
                '<div class="result-actions" style="margin-top:14px;">' +
                    '<button class="result-btn" id="sa-copy">Copy Results</button>' +
                    '<button class="result-btn" id="sa-dl-chart">Download Chart</button>' +
                '</div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('sa-upload-wrap'), '.txt,.pdf', function(file) {
            if (file.type === 'application/pdf') {
                file.arrayBuffer().then(function(bytes) {
                    return pdfjsLib.getDocument({ data: bytes }).promise;
                }).then(function(doc) {
                    var allText = '';
                    function nextPage(i) {
                        if (i > doc.numPages) {
                            document.getElementById('sa-input').value = allText.trim();
                            Toast.success('Extracted from PDF');
                            return;
                        }
                        doc.getPage(i).then(function(p) { return p.getTextContent(); }).then(function(c) {
                            allText += c.items.map(function(x) { return x.str; }).join(' ') + ' ';
                            nextPage(i + 1);
                        });
                    }
                    nextPage(1);
                });
            } else {
                var reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('sa-input').value = e.target.result;
                    Toast.success('Loaded');
                };
                reader.readAsText(file);
            }
        });

        document.getElementById('sa-chart').addEventListener('change', function() {
            if (self.state.sentenceResults) self.drawChart(self.state.sentenceResults);
        });

        document.getElementById('sa-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('sa-copy').addEventListener('click', function() {
            if (self.state.resultText) { navigator.clipboard.writeText(self.state.resultText); Toast.success('Copied'); }
        });

        document.getElementById('sa-dl-chart').addEventListener('click', function() {
            var canvas = document.getElementById('sa-canvas');
            if (canvas) canvas.toBlob(function(blob) { Utils.downloadBlob(blob, 'sentiment-chart.png'); });
        });
    },

    scoreSentence: function(sentence) {
        var self = this;
        var words = sentence.toLowerCase().replace(/[^a-z\s'-]/g, '').split(/\s+/);
        var score = 0;
        var negators = ['not','never','no',"n't",'dont','doesnt','didnt','wont','cant','cannot','neither','nor'];
        var intensifiers = ['very','really','extremely','absolutely','totally','completely','incredibly','highly','so'];
        var negateNext = false, intensify = false;

        for (var w = 0; w < words.length; w++) {
            var word = words[w];
            if (negators.indexOf(word) !== -1) { negateNext = true; continue; }
            if (intensifiers.indexOf(word) !== -1) { intensify = true; continue; }

            if (self.lexicon.hasOwnProperty(word)) {
                var s = self.lexicon[word];
                if (negateNext) { s = s * -0.75; negateNext = false; }
                if (intensify) { s = s * 1.5; intensify = false; }
                score += s;
            } else {
                negateNext = false;
                intensify = false;
            }
        }
        return score;
    },

    execute: function() {
        var self = this;
        var text = document.getElementById('sa-input').value;
        if (!text.trim()) { Toast.error('Please enter some text'); return; }

        var sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
        sentences = sentences.filter(function(s) { return s.trim().length > 5; });

        var sentenceResults = sentences.map(function(s) {
            var score = self.scoreSentence(s);
            var label = score > 2 ? 'Very Positive' : score > 0.5 ? 'Positive' : score < -2 ? 'Very Negative' : score < -0.5 ? 'Negative' : 'Neutral';
            return { text: s.trim(), score: score, label: label };
        });

        var totalScore = sentenceResults.reduce(function(s, r) { return s + r.score; }, 0);
        var avgScore = sentenceResults.length > 0 ? totalScore / sentenceResults.length : 0;
        var positive = sentenceResults.filter(function(r) { return r.score > 0.5; }).length;
        var negative = sentenceResults.filter(function(r) { return r.score < -0.5; }).length;
        var neutral = sentenceResults.length - positive - negative;

        var overallLabel = avgScore > 2 ? 'Very Positive' : avgScore > 0.5 ? 'Positive' : avgScore < -2 ? 'Very Negative' : avgScore < -0.5 ? 'Negative' : 'Neutral';
        var overallColor = (avgScore > 0.5) ? 'var(--success)' : (avgScore < -0.5) ? 'var(--danger)' : 'var(--text-muted)';

        self.state.sentenceResults = sentenceResults;

        // Gauge
        var gaugeW = Math.max(0, Math.min(100, ((avgScore + 5) / 10) * 100));
        document.getElementById('sa-gauge').innerHTML =
            '<div class="gauge-label" style="color:' + overallColor + ';font-size:1.6rem;font-weight:800;margin-bottom:4px;">' + overallLabel + '</div>' +
            '<div style="font-size:0.76rem;color:var(--text-muted);margin-bottom:14px;">Avg score per sentence: <strong style="color:' + overallColor + '">' + avgScore.toFixed(2) + '</strong></div>' +
            '<div class="gauge-track">' +
                '<div class="gauge-marker" style="left:' + gaugeW + '%"></div>' +
            '</div>' +
            '<div class="gauge-labels"><span style="color:var(--danger)">Negative</span><span>Neutral</span><span style="color:var(--success)">Positive</span></div>';

        // Stats
        document.getElementById('sa-stats').innerHTML =
            '<div class="stat-box"><div class="stat-box__value">' + sentenceResults.length + '</div><div class="stat-box__label">Sentences</div></div>' +
            '<div class="stat-box"><div class="stat-box__value" style="color:var(--success)">' + positive + '</div><div class="stat-box__label">Positive</div></div>' +
            '<div class="stat-box"><div class="stat-box__value" style="color:var(--danger)">' + negative + '</div><div class="stat-box__label">Negative</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + neutral + '</div><div class="stat-box__label">Neutral</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + totalScore.toFixed(1) + '</div><div class="stat-box__label">Total Score</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + avgScore.toFixed(2) + '</div><div class="stat-box__label">Avg / Sentence</div></div>';

        self.drawChart(sentenceResults);

        // Sentence breakdown
        var html = sentenceResults.map(function(r) {
            var c = r.score > 0.5 ? 'var(--success)' : r.score < -0.5 ? 'var(--danger)' : 'var(--text-muted)';
            return '<div style="padding:7px 0;border-bottom:1px solid var(--border-subtle);display:flex;gap:8px;align-items:flex-start;">' +
                '<span style="width:8px;height:8px;border-radius:50%;background:' + c + ';flex-shrink:0;margin-top:6px;"></span>' +
                '<span style="flex:1;font-size:0.8rem;">' + r.text + '</span>' +
                '<span style="flex-shrink:0;font-size:0.72rem;color:' + c + ';font-weight:700;min-width:36px;text-align:right;">' + (r.score > 0 ? '+' : '') + r.score.toFixed(1) + '</span>' +
            '</div>';
        }).join('');
        document.getElementById('sa-sentences').innerHTML = html;

        // Copy
        self.state.resultText = 'Sentiment Analysis\n---\nOverall: ' + overallLabel + ' (' + avgScore.toFixed(2) + ')\n' +
            'Positive: ' + positive + ' | Negative: ' + negative + ' | Neutral: ' + neutral + '\n\n' +
            sentenceResults.map(function(r) { return '[' + (r.score > 0 ? '+' : '') + r.score.toFixed(1) + '] ' + r.text; }).join('\n');

        document.getElementById('sa-results').classList.add('visible');
        Toast.success('Analysis complete');
    },

    drawChart: function(sentenceResults) {
        var type = document.getElementById('sa-chart').value;
        var canvas = document.getElementById('sa-canvas');
        var container = canvas.parentElement;
        var W = container.offsetWidth || 600;
        var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        var textColor = isDark ? '#9494a0' : '#55555f';
        var gridColor = isDark ? '#1e1e26' : '#eaebef';
        var bgColor = isDark ? '#111114' : '#ffffff';

        if (type === 'timeline') {
            var H = 260;
            canvas.width = W;
            canvas.height = H;
            canvas.style.height = H + 'px';
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, W, H);

            var padL = 44, padR = 20, padT = 20, padB = 40;
            var chartW = W - padL - padR;
            var chartH = H - padT - padB;
            var scores = sentenceResults.map(function(r) { return r.score; });
            var maxAbs = Math.max(5, Math.max.apply(null, scores.map(function(s) { return Math.abs(s); })));

            // Zero line
            var zeroY = padT + chartH / 2;
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padL, zeroY);
            ctx.lineTo(padL + chartW, zeroY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Axis labels
            ctx.fillStyle = textColor;
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('+' + maxAbs.toFixed(0), padL - 4, padT + 4);
            ctx.fillText('0', padL - 4, zeroY + 4);
            ctx.fillText('-' + maxAbs.toFixed(0), padL - 4, padT + chartH + 4);

            if (scores.length < 2) {
                ctx.fillStyle = textColor;
                ctx.textAlign = 'center';
                ctx.fillText('Need more sentences for timeline', W / 2, H / 2);
                return;
            }

            var step = chartW / (scores.length - 1);

            // Fill area
            ctx.beginPath();
            ctx.moveTo(padL, zeroY);
            scores.forEach(function(s, i) {
                var x = padL + i * step;
                var y = zeroY - (s / maxAbs) * (chartH / 2);
                ctx.lineTo(x, y);
            });
            ctx.lineTo(padL + (scores.length - 1) * step, zeroY);
            ctx.closePath();
            ctx.fillStyle = 'rgba(108, 99, 255, 0.07)';
            ctx.fill();

            // Line
            ctx.beginPath();
            scores.forEach(function(s, i) {
                var x = padL + i * step;
                var y = zeroY - (s / maxAbs) * (chartH / 2);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = 'var(--accent)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Dots
            scores.forEach(function(s, i) {
                var x = padL + i * step;
                var y = zeroY - (s / maxAbs) * (chartH / 2);
                var dotColor = s > 0.5 ? '#22c55e' : s < -0.5 ? '#ef4444' : '#9494a0';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = dotColor;
                ctx.fill();
            });

            // X labels
            var labelEvery = Math.max(1, Math.floor(scores.length / 8));
            ctx.fillStyle = textColor;
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            scores.forEach(function(s, i) {
                if (i % labelEvery === 0) {
                    ctx.fillText('S' + (i + 1), padL + i * step, padT + chartH + 16);
                }
            });

            // Chart title
            ctx.fillStyle = textColor;
            ctx.font = 'bold 10px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sentiment Score by Sentence', W / 2, 12);

        } else if (type === 'distribution') {
            // Histogram of score distribution
            var H = 260;
            canvas.width = W;
            canvas.height = H;
            canvas.style.height = H + 'px';
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, W, H);

            var scores = sentenceResults.map(function(r) { return r.score; });
            var buckets = { 'Very Neg': 0, 'Neg': 0, 'Neutral': 0, 'Pos': 0, 'Very Pos': 0 };
            var bucketColors = ['#ef4444', '#f97316', '#9494a0', '#22c55e', '#16a34a'];

            scores.forEach(function(s) {
                if (s <= -3) buckets['Very Neg']++;
                else if (s < -0.5) buckets['Neg']++;
                else if (s <= 0.5) buckets['Neutral']++;
                else if (s < 3) buckets['Pos']++;
                else buckets['Very Pos']++;
            });

            var keys = Object.keys(buckets);
            var maxB = Math.max.apply(null, keys.map(function(k) { return buckets[k]; })) || 1;
            var padL = 44, padR = 20, padT = 30, padB = 40;
            var chartW = W - padL - padR;
            var chartH = H - padT - padB;
            var bW = (chartW / keys.length) * 0.65;
            var bGap = (chartW / keys.length) * 0.35;

            // Grid
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            for (var g = 0; g <= 4; g++) {
                var y = padT + chartH - (g / 4) * chartH;
                ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
                ctx.fillStyle = textColor;
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(Math.round((g / 4) * maxB), padL - 4, y + 4);
            }
            ctx.setLineDash([]);

            keys.forEach(function(key, i) {
                var bH = (buckets[key] / maxB) * chartH;
                var bX = padL + i * (chartW / keys.length) + bGap / 2;
                var bY = padT + chartH - bH;

                ctx.fillStyle = bucketColors[i];
                ctx.globalAlpha = 0.85;
                ctx.beginPath();
                var r = Math.min(4, bW / 2);
                if (bH > 0) {
                    ctx.moveTo(bX + r, bY);
                    ctx.lineTo(bX + bW - r, bY);
                    ctx.quadraticCurveTo(bX + bW, bY, bX + bW, bY + r);
                    ctx.lineTo(bX + bW, padT + chartH);
                    ctx.lineTo(bX, padT + chartH);
                    ctx.lineTo(bX, bY + r);
                    ctx.quadraticCurveTo(bX, bY, bX + r, bY);
                }
                ctx.fill();
                ctx.globalAlpha = 1;

                ctx.fillStyle = textColor;
                ctx.font = '10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                if (buckets[key] > 0) ctx.fillText(buckets[key], bX + bW / 2, bY - 5);
                ctx.fillText(key, bX + bW / 2, padT + chartH + 16);
            });

            ctx.fillStyle = textColor;
            ctx.font = 'bold 10px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sentiment Distribution', W / 2, 16);
        }
    }
};