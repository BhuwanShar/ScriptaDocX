/* ================================================================
   Scripta — Readability Report with Radar Chart
   ================================================================ */

var ReadabilityTool = {
    id: 'readability',
    name: 'Readability Report',
    description: 'Score text across 5 readability metrics with a radar chart visualization',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    category: 'text',
    state: {},

    render: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div class="settings-card">' +
                '<div class="settings-card__title">Input Text</div>' +
                '<p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;">Recommended: at least 100 words for accurate scores.</p>' +
                '<textarea id="rd-input" class="text-input" placeholder="Paste text to measure readability..." rows="10"></textarea>' +
            '</div>' +
            '<div id="rd-upload-wrap"></div>' +
            '<button class="action-btn action-btn--primary" id="rd-start">Analyze Readability</button>' +
            '<div class="results-card" id="rd-results">' +
                '<div class="results-card__title">Readability Report</div>' +
                '<div class="stats-grid" id="rd-stats"></div>' +
                '<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin:18px 0;">' +
                    '<canvas id="rd-radar" width="280" height="280" style="flex-shrink:0;"></canvas>' +
                    '<div id="rd-metrics" style="flex:1;min-width:200px;"></div>' +
                '</div>' +
                '<div class="result-actions" style="margin-top:14px;">' +
                    '<button class="result-btn" id="rd-copy">Copy Report</button>' +
                    '<button class="result-btn" id="rd-dl">Download Chart</button>' +
                '</div>' +
            '</div>';

        Utils.createUploadZone(document.getElementById('rd-upload-wrap'), '.txt,.pdf', function(file) {
            if (file.type === 'application/pdf') {
                file.arrayBuffer().then(function(bytes) {
                    return pdfjsLib.getDocument({ data: bytes }).promise;
                }).then(function(doc) {
                    var allText = '';
                    function np(i) {
                        if (i > doc.numPages) { document.getElementById('rd-input').value = allText.trim(); Toast.success('PDF loaded'); return; }
                        doc.getPage(i).then(function(p) { return p.getTextContent(); }).then(function(c) {
                            allText += c.items.map(function(x) { return x.str; }).join(' ') + ' '; np(i + 1);
                        });
                    }
                    np(1);
                });
            } else {
                var r = new FileReader();
                r.onload = function(e) { document.getElementById('rd-input').value = e.target.result; Toast.success('Loaded'); };
                r.readAsText(file);
            }
        });

        document.getElementById('rd-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('rd-copy').addEventListener('click', function() {
            if (self.state.report) { navigator.clipboard.writeText(self.state.report); Toast.success('Copied'); }
        });

        document.getElementById('rd-dl').addEventListener('click', function() {
            var c = document.getElementById('rd-radar');
            if (c) c.toBlob(function(b) { Utils.downloadBlob(b, 'readability-radar.png'); });
        });
    },

    syllables: function(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (!word) return 0;
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        var m = word.match(/[aeiouy]{1,2}/g);
        return m ? Math.max(1, m.length) : 1;
    },

    execute: function() {
        var self = this;
        var text = document.getElementById('rd-input').value;
        if (!text.trim()) { Toast.error('Please enter text'); return; }

        var sentences = (text.match(/[^.!?]+[.!?]+/g) || [text]).filter(function(s) { return s.trim().length > 3; });
        var wordsRaw = text.replace(/[^a-zA-Z\s'-]/g, ' ').split(/\s+/).filter(function(w) { return w.length > 0; });
        var nSentences = Math.max(1, sentences.length);
        var nWords = Math.max(1, wordsRaw.length);
        var nSyllables = wordsRaw.reduce(function(s, w) { return s + self.syllables(w); }, 0);
        var nChars = text.replace(/\s/g, '').length;
        var nComplex = wordsRaw.filter(function(w) { return self.syllables(w) >= 3; }).length;
        var avgSentLen = nWords / nSentences;
        var avgSylPerWord = nSyllables / nWords;

        // 1. Flesch Reading Ease (0-100, higher = easier)
        var flesch = Math.max(0, Math.min(100,
            206.835 - 1.015 * avgSentLen - 84.6 * avgSylPerWord
        ));

        // 2. Flesch-Kincaid Grade Level (school grade)
        var fkGrade = Math.max(0,
            0.39 * avgSentLen + 11.8 * avgSylPerWord - 15.59
        );

        // 3. Gunning Fog Index (grade level)
        var fog = Math.max(0,
            0.4 * (avgSentLen + 100 * (nComplex / nWords))
        );

        // 4. SMOG Grade
        var smog = nSentences >= 30 ?
            3 + Math.sqrt(nComplex * (30 / nSentences)) :
            Math.max(0, 3 + Math.sqrt(nComplex));

        // 5. Coleman-Liau Index
        var L = (nChars / nWords) * 100;
        var S = (nSentences / nWords) * 100;
        var cli = Math.max(0, 0.0588 * L - 0.296 * S - 15.8);

        // Normalize scores to 0-100 for radar (higher = more readable)
        function gradeToScore(grade) {
            return Math.max(0, Math.min(100, 100 - (grade - 1) * 5));
        }

        var radarScores = {
            'Flesch\nEase': Math.round(flesch),
            'FK\nGrade': Math.round(gradeToScore(fkGrade)),
            'Gunning\nFog': Math.round(gradeToScore(fog)),
            'SMOG': Math.round(gradeToScore(smog)),
            'Coleman\nLiau': Math.round(gradeToScore(cli))
        };

        self.state.radarScores = radarScores;

        // Labels
        function fleschLabel(s) {
            if (s >= 90) return 'Very Easy (5th grade)';
            if (s >= 80) return 'Easy (6th grade)';
            if (s >= 70) return 'Fairly Easy (7th grade)';
            if (s >= 60) return 'Standard (8-9th grade)';
            if (s >= 50) return 'Fairly Difficult (10-12th grade)';
            if (s >= 30) return 'Difficult (College)';
            return 'Very Difficult (Professional)';
        }

        // Stats
        document.getElementById('rd-stats').innerHTML =
            '<div class="stat-box"><div class="stat-box__value">' + nWords + '</div><div class="stat-box__label">Words</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + nSentences + '</div><div class="stat-box__label">Sentences</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + avgSentLen.toFixed(1) + '</div><div class="stat-box__label">Avg Sent Length</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + avgSylPerWord.toFixed(2) + '</div><div class="stat-box__label">Avg Syllables/Word</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + nComplex + '</div><div class="stat-box__label">Complex Words</div></div>' +
            '<div class="stat-box"><div class="stat-box__value">' + ((nComplex / nWords) * 100).toFixed(1) + '%</div><div class="stat-box__label">% Complex</div></div>';

        // Metric list
        var metrics = [
            { name: 'Flesch Reading Ease', value: flesch.toFixed(1), note: fleschLabel(flesch), unit: '/100', color: '#6c63ff' },
            { name: 'Flesch-Kincaid Grade', value: fkGrade.toFixed(1), note: 'US School Grade Level', unit: '', color: '#f7436d' },
            { name: 'Gunning Fog Index', value: fog.toFixed(1), note: 'Grade Level', unit: '', color: '#22c55e' },
            { name: 'SMOG Grade', value: smog.toFixed(1), note: 'Years of Education Needed', unit: '', color: '#eab308' },
            { name: 'Coleman-Liau Index', value: cli.toFixed(1), note: 'US Grade Level', unit: '', color: '#3b82f6' }
        ];

        var metricsHtml = metrics.map(function(m) {
            return '<div style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<span style="font-size:0.8rem;color:var(--text-secondary);font-weight:500;">' + m.name + '</span>' +
                    '<span style="font-size:1.1rem;font-weight:700;color:' + m.color + '">' + m.value + m.unit + '</span>' +
                '</div>' +
                '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">' + m.note + '</div>' +
            '</div>';
        }).join('');
        document.getElementById('rd-metrics').innerHTML = metricsHtml;

        self.drawRadar(radarScores);

        // Report
        self.state.report = 'Readability Report\n---\n' +
            'Words: ' + nWords + ' | Sentences: ' + nSentences + '\n' +
            'Avg sentence length: ' + avgSentLen.toFixed(1) + '\n\n' +
            metrics.map(function(m) { return m.name + ': ' + m.value + ' (' + m.note + ')'; }).join('\n');

        document.getElementById('rd-results').classList.add('visible');
        Toast.success('Readability analysis complete');
    },

    drawRadar: function(scores) {
        var canvas = document.getElementById('rd-radar');
        var W = canvas.width;
        var H = canvas.height;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        var gridColor = isDark ? '#2a2a34' : '#eaebef';
        var textColor = isDark ? '#9494a0' : '#55555f';

        var cx = W / 2, cy = H / 2 + 10;
        var maxR = Math.min(W, H) / 2 - 48;
        var keys = Object.keys(scores);
        var n = keys.length;
        var values = keys.map(function(k) { return scores[k] / 100; });

        function point(angle, r) {
            return {
                x: cx + Math.cos(angle - Math.PI / 2) * r,
                y: cy + Math.sin(angle - Math.PI / 2) * r
            };
        }

        // Grid rings
        [0.25, 0.5, 0.75, 1].forEach(function(level) {
            ctx.beginPath();
            for (var i = 0; i < n; i++) {
                var angle = (i / n) * Math.PI * 2;
                var p = point(angle, maxR * level);
                if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            if (level < 1) {
                ctx.fillStyle = textColor;
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText((level * 100).toFixed(0), cx + 3, cy - maxR * level + 10);
            }
        });

        // Axis lines
        for (var i = 0; i < n; i++) {
            var angle = (i / n) * Math.PI * 2;
            var p = point(angle, maxR);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Data polygon
        ctx.beginPath();
        values.forEach(function(v, i) {
            var angle = (i / n) * Math.PI * 2;
            var p = point(angle, maxR * v);
            if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(108, 99, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(108, 99, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Data points
        values.forEach(function(v, i) {
            var angle = (i / n) * Math.PI * 2;
            var p = point(angle, maxR * v);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#6c63ff';
            ctx.fill();
        });

        // Labels
        ctx.fillStyle = textColor;
        ctx.font = '10px -apple-system, sans-serif';
        keys.forEach(function(key, i) {
            var angle = (i / n) * Math.PI * 2;
            var p = point(angle, maxR + 22);
            ctx.textAlign = 'center';
            var lines = key.split('\n');
            lines.forEach(function(line, li) {
                ctx.fillText(line, p.x, p.y + li * 13);
            });
        });

        // Center label
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Readability', cx, cy + 3);
    }
};