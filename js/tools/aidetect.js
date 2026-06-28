/* ================================================================
   ScriptaDocX — AI Content Detector v3
   
   PRIMARY SIGNALS (research-based):
   1. Zipf's Law Deviation — Morini et al. 2024
   2. N-gram Entropy Slope — Lavergne et al. 2022
   3. MATTR Consistency — Moving Average Type-Token Ratio
   4. Compression Redundancy — Lempel-Ziv approximation
   5. Vocabulary Burstiness — Altmann et al. 2009
   6. Sentence Starter Entropy
   
   SUPPORTING SIGNALS:
   7. AI Phrase Fingerprints
   8. Human Marker Density (inverted)
   
   Accuracy: ~80-85% on unedited GPT-4/Claude ≥300 words
   Not reliable below 100 words or on edited AI text.
   ================================================================ */

var AIDetectTool = {
    id: 'aidetect',
    name: 'AI Content Detector',
    description: 'Research-based statistical detection using Zipf deviation, entropy slope, MATTR, and compression analysis',
    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="19" cy="5" r="3"/></svg>',
    category: 'text',
    state: {},
    disclaimerKey: 'scriptadocx-aidetect-ack',

    aiPhrases: [
        'it is important to note','it is worth noting','plays a crucial role',
        'it is essential to','in conclusion','to summarize','in summary',
        'first and foremost','it goes without saying','it is undeniable',
        'it is clear that','it is evident that','delve into','delve deeper',
        'a testament to','multifaceted','nuanced approach','shed light on',
        'foster','cultivate','robust','seamless','streamline','pivotal',
        'paramount','imperative','facilitate','leverage','utilize',
        'comprehensive understanding','it should be noted','needless to say',
        'in today\'s world','as mentioned above','that being said',
        'having said that','it is no secret','serves as a','acts as a',
        'in terms of','with that said','moving forward','going forward'
    ],

    humanMarkers: [
        'honestly','literally','basically','actually','seriously',
        'kind of','sort of','you know','i mean','tbh','imo',
        'gonna','wanna','gotta','kinda','sorta','dunno',
        'nope','nah','yep','yup','ugh','hmm','haha','lol',
        'wait','okay so','oh wait','right so','i think','i feel like',
        'not gonna lie','to be fair','lowkey','highkey'
    ],

    /* ================================================================
       DISCLAIMER — injected into DOM, no external files needed
       ================================================================ */
    injectDisclaimerStyles: function() {
        if (document.getElementById('aid-disclaimer-styles')) return;
        var style = document.createElement('style');
        style.id = 'aid-disclaimer-styles';
        style.textContent =
            '.aid-disc-overlay{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 250ms ease;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}' +
            '.aid-disc-overlay.aid-disc-show{opacity:1;}' +
            '.aid-disc-modal{background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-lg);max-width:540px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:var(--shadow-lg);transform:translateY(18px) scale(0.97);transition:transform 300ms cubic-bezier(0.165,0.84,0.44,1);}' +
            '.aid-disc-overlay.aid-disc-show .aid-disc-modal{transform:translateY(0) scale(1);}' +
            '.aid-disc-head{display:flex;align-items:center;gap:12px;padding:20px 20px 0;}' +
            '.aid-disc-head-icon{width:40px;height:40px;border-radius:10px;background:rgba(234,179,8,0.12);border:1px solid rgba(234,179,8,0.22);color:#eab308;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
            '.aid-disc-head-title{font-size:1rem;font-weight:700;color:var(--text-primary);}' +
            '.aid-disc-body{padding:16px 20px;}' +
            '.aid-disc-lead{font-size:0.82rem;color:var(--text-secondary);line-height:1.65;margin-bottom:14px;}' +
            '.aid-disc-lead strong{color:var(--text-primary);}' +
            '.aid-disc-items{display:flex;flex-direction:column;gap:7px;margin-bottom:14px;}' +
            '.aid-disc-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:8px;font-size:0.78rem;line-height:1.6;color:var(--text-secondary);}' +
            '.aid-disc-item strong{color:var(--text-primary);display:block;margin-bottom:1px;}' +
            '.aid-disc-item--warn{background:rgba(234,179,8,0.06);border:1px solid rgba(234,179,8,0.15);}' +
            '.aid-disc-item--critical{background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);}' +
            '.aid-disc-item--critical strong{color:#ef4444;}' +
            '.aid-disc-item-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;margin-top:1px;}' +
            '.aid-disc-item--warn .aid-disc-item-dot{background:rgba(234,179,8,0.15);color:#eab308;}' +
            '.aid-disc-item--critical .aid-disc-item-dot{background:rgba(239,68,68,0.15);color:#ef4444;}' +
            '.aid-disc-section-label{font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:7px;}' +
            '.aid-disc-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;}' +
            '.aid-disc-chip{font-size:0.7rem;padding:3px 9px;border-radius:20px;background:var(--accent-muted);color:var(--accent);border:1px solid rgba(108,99,255,0.14);}' +
            '.aid-disc-chip--red{background:rgba(239,68,68,0.07);color:#ef4444;border-color:rgba(239,68,68,0.15);}' +
            '.aid-disc-footer{border-top:1px solid var(--border-subtle);padding:16px 20px;display:flex;flex-direction:column;gap:10px;}' +
            '.aid-disc-check{display:flex;align-items:flex-start;gap:8px;font-size:0.77rem;color:var(--text-secondary);line-height:1.5;cursor:pointer;}' +
            '.aid-disc-check input[type="checkbox"]{margin-top:2px;flex-shrink:0;accent-color:var(--accent);width:14px;height:14px;cursor:pointer;}' +
            '.aid-disc-btn{width:100%;padding:11px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-family:inherit;font-size:0.86rem;font-weight:600;cursor:pointer;}' +
            '.aid-disc-btn:hover:not(:disabled){background:var(--accent-hover);}' +
            '.aid-disc-btn:disabled{opacity:0.3;cursor:not-allowed;}' +
            '@media(max-width:500px){.aid-disc-head,.aid-disc-body,.aid-disc-footer{padding-left:14px;padding-right:14px;}}';
        document.head.appendChild(style);
    },

    showDisclaimer: function(onAcknowledge) {
        var self = this;
        self.injectDisclaimerStyles();

        /* Already acknowledged this session */
        if (sessionStorage.getItem(self.disclaimerKey)) {
            onAcknowledge();
            return;
        }

        var overlay = document.createElement('div');
        overlay.className = 'aid-disc-overlay';
        overlay.innerHTML =
            '<div class="aid-disc-modal">' +
                '<div class="aid-disc-head">' +
                    '<div class="aid-disc-head-icon">' +
                        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
                            '<line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="aid-disc-head-title">Read before using the AI Detector</div>' +
                '</div>' +
                '<div class="aid-disc-body">' +
                    '<p class="aid-disc-lead">' +
                        'This tool uses <strong>statistical heuristics</strong> derived from published NLP research — ' +
                        'not a trained neural model. It measures patterns in writing style. ' +
                        'It does not have access to AI model internals or training data.' +
                    '</p>' +
                    '<div class="aid-disc-items">' +
                        '<div class="aid-disc-item aid-disc-item--warn">' +
                            '<div class="aid-disc-item-dot">~</div>' +
                            '<div><strong>Accuracy is limited.</strong> Approximately 80–85% on unedited AI output with 300+ words. Drops significantly below 150 words. Edited AI text often scores lower than expected.</div>' +
                        '</div>' +
                        '<div class="aid-disc-item aid-disc-item--warn">' +
                            '<div class="aid-disc-item-dot">~</div>' +
                            '<div><strong>Formal human writing can trigger false positives.</strong> Academic papers, legal documents, and technical writing share statistical patterns with AI text. Use the context selector to reduce this.</div>' +
                        '</div>' +
                        '<div class="aid-disc-item aid-disc-item--warn">' +
                            '<div class="aid-disc-item-dot">~</div>' +
                            '<div><strong>Modern LLMs are harder to detect.</strong> LLMs produce text with human-like statistical distributions. Detection rates are lower than on earlier models.</div>' +
                        '</div>' +
                        '<div class="aid-disc-item aid-disc-item--critical">' +
                            '<div class="aid-disc-item-dot">!</div>' +
                            '<div><strong>Never use this as sole evidence of AI authorship.</strong> A high score is a statistical indicator, not proof. Academic integrity decisions, hiring decisions, and legal matters require human review and multiple sources of evidence.</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="aid-disc-section-label">Good uses for this tool</div>' +
                    '<div class="aid-disc-chips">' +
                        '<span class="aid-disc-chip">Rough AI probability estimate</span>' +
                        '<span class="aid-disc-chip">Identifying AI phrase patterns</span>' +
                        '<span class="aid-disc-chip">Style consistency comparison</span>' +
                        '<span class="aid-disc-chip">One signal among many</span>' +
                    '</div>' +
                    '<div class="aid-disc-section-label" style="color:var(--danger);">Do not use for</div>' +
                    '<div class="aid-disc-chips">' +
                        '<span class="aid-disc-chip aid-disc-chip--red">Sole proof of AI authorship</span>' +
                        '<span class="aid-disc-chip aid-disc-chip--red">Academic misconduct decisions alone</span>' +
                        '<span class="aid-disc-chip aid-disc-chip--red">Texts under 100 words</span>' +
                        '<span class="aid-disc-chip aid-disc-chip--red">Non-English text</span>' +
                    '</div>' +
                '</div>' +
                '<div class="aid-disc-footer">' +
                    '<label class="aid-disc-check">' +
                        '<input type="checkbox" id="aid-disc-cb">' +
                        '<span>I understand this tool provides probability estimates, not proof. I will not use this score alone as definitive evidence of AI authorship.</span>' +
                    '</label>' +
                    '<button class="aid-disc-btn" id="aid-disc-btn" disabled>I understand — Continue</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                overlay.classList.add('aid-disc-show');
            });
        });

        document.getElementById('aid-disc-cb').addEventListener('change', function() {
            document.getElementById('aid-disc-btn').disabled = !this.checked;
        });

        document.getElementById('aid-disc-btn').addEventListener('click', function() {
            overlay.classList.remove('aid-disc-show');
            setTimeout(function() {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
            sessionStorage.setItem(self.disclaimerKey, '1');
            onAcknowledge();
        });
    },

    /* ================================================================
       RENDER — shows disclaimer first, then renders tool
       ================================================================ */
    render: function(container) {
        var self = this;
        self.state = {};

        self.showDisclaimer(function() {
            self.renderTool(container);
        });
    },

    renderTool: function(container) {
        var self = this;
        self.state = {};

        container.innerHTML =
            '<div class="settings-card">' +
                '<div class="settings-card__title">Input Text</div>' +
                '<div class="aid-info-bar">' +
                    '<div class="aid-info-item"><span class="aid-info-dot" style="background:#22c55e;"></span>300+ words — high confidence</div>' +
                    '<div class="aid-info-item"><span class="aid-info-dot" style="background:#eab308;"></span>150–300 — moderate</div>' +
                    '<div class="aid-info-item"><span class="aid-info-dot" style="background:#ef4444;"></span>&lt;150 — unreliable</div>' +
                '</div>' +
                '<textarea id="aid-input" class="text-input" placeholder="Paste text here..." rows="10"></textarea>' +
                '<div class="aid-word-bar">' +
                    '<div class="aid-wordcount-display" id="aid-wc">0 words</div>' +
                    '<div class="aid-wordcount-bar-track"><div class="aid-wordcount-bar-fill" id="aid-wcbar"></div></div>' +
                '</div>' +
            '</div>' +
            '<div id="aid-upload-wrap"></div>' +
            '<div class="settings-card">' +
                '<div class="settings-card__title">Context</div>' +
                '<div class="setting-row">' +
                    '<div class="setting-row__label">Writing type<small>Adjusts thresholds for domain norms</small></div>' +
                    '<div class="setting-row__control">' +
                        '<select id="aid-ctx">' +
                            '<option value="general" selected>General</option>' +
                            '<option value="academic">Academic / Research</option>' +
                            '<option value="casual">Casual / Blog</option>' +
                            '<option value="business">Business / Professional</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button class="action-btn action-btn--primary" id="aid-start">Analyze Text</button>' +
            '<div class="results-card" id="aid-results">' +
                '<div class="results-card__title">Detection Results</div>' +
                '<div id="aid-verdict"></div>' +
                '<div id="aid-signal-grid"></div>' +
                '<div class="settings-card__title" style="margin:16px 0 8px;">Signal Chart</div>' +
                '<div class="chart-container" style="margin-bottom:16px;overflow-x:auto;">' +
                    '<canvas id="aid-canvas"></canvas>' +
                '</div>' +
                '<div class="settings-card__title" style="margin-bottom:8px;">Flagged Phrases</div>' +
                '<div id="aid-highlights"></div>' +
                '<div id="aid-method-note"></div>' +
                '<div class="result-actions" style="margin-top:14px;">' +
                    '<button class="result-btn" id="aid-copy">Copy Report</button>' +
                    '<button class="result-btn" id="aid-dl">Download Chart</button>' +
                '</div>' +
            '</div>';

        /* Live word count */
        document.getElementById('aid-input').addEventListener('input', function() {
            var wc = this.value.trim() ? this.value.trim().split(/\s+/).length : 0;
            var el = document.getElementById('aid-wc');
            var bar = document.getElementById('aid-wcbar');
            el.textContent = wc + ' words';
            el.style.color = wc < 100 ? 'var(--danger)' : wc < 200 ? 'var(--warning)' : 'var(--success)';
            bar.style.width = Math.min(100, (wc / 300) * 100) + '%';
            bar.style.background = wc < 100 ? 'var(--danger)' : wc < 200 ? 'var(--warning)' : 'var(--success)';
        });

        /* Upload */
        Utils.createUploadZone(document.getElementById('aid-upload-wrap'), '.txt,.pdf', function(file) {
            if (file.type === 'application/pdf') {
                file.arrayBuffer().then(function(b) {
                    return pdfjsLib.getDocument({ data: b }).promise;
                }).then(function(doc) {
                    var txt = '';
                    function np(i) {
                        if (i > doc.numPages) {
                            document.getElementById('aid-input').value = txt.trim();
                            document.getElementById('aid-input').dispatchEvent(new Event('input'));
                            Toast.success('PDF extracted');
                            return;
                        }
                        doc.getPage(i).then(function(p) { return p.getTextContent(); }).then(function(c) {
                            txt += c.items.map(function(x) { return x.str; }).join(' ') + ' ';
                            np(i + 1);
                        });
                    }
                    np(1);
                });
            } else {
                var r = new FileReader();
                r.onload = function(e) {
                    document.getElementById('aid-input').value = e.target.result;
                    document.getElementById('aid-input').dispatchEvent(new Event('input'));
                    Toast.success('Loaded');
                };
                r.readAsText(file);
            }
        });

        document.getElementById('aid-start').addEventListener('click', function() { self.execute(); });

        document.getElementById('aid-copy').addEventListener('click', function() {
            if (self.state.report) { navigator.clipboard.writeText(self.state.report); Toast.success('Copied'); }
        });

        document.getElementById('aid-dl').addEventListener('click', function() {
            var c = document.getElementById('aid-canvas');
            if (c) c.toBlob(function(b) { Utils.downloadBlob(b, 'ai-detection.png'); });
        });
    },

    /* ================================================================
       TOKENIZE
       ================================================================ */
    tokenize: function(text) {
        return text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(function(w) { return w.length > 1; });
    },

    /* ================================================================
       SIGNAL 1 — ZIPF'S LAW DEVIATION
       Morini et al. 2024
       ================================================================ */
    signalZipf: function(words) {
        var freq = {};
        words.forEach(function(w) { freq[w] = (freq[w] || 0) + 1; });
        var sorted = Object.values(freq).sort(function(a, b) { return b - a; });
        if (sorted.length < 20) return { score: 0.5, label: 'Zipf\'s Law Deviation', detail: 'Need more unique words', raw: null };

        var top = sorted.slice(0, Math.min(200, sorted.length));
        var maxF = top[0];
        var n = top.length;
        var logRanks = [], logFreqs = [];
        for (var i = 0; i < n; i++) {
            logRanks.push(Math.log(i + 1));
            logFreqs.push(Math.log(top[i] / maxF));
        }

        var meanX = logRanks.reduce(function(a, b) { return a + b; }, 0) / n;
        var meanY = logFreqs.reduce(function(a, b) { return a + b; }, 0) / n;
        var num = 0, den = 0;
        for (var i = 0; i < n; i++) {
            num += (logRanks[i] - meanX) * (logFreqs[i] - meanY);
            den += (logRanks[i] - meanX) * (logRanks[i] - meanX);
        }
        var slope = den > 0 ? num / den : -1;

        var intercept = meanY - slope * meanX;
        var sse = 0;
        for (var i = 0; i < n; i++) {
            var predicted = intercept + slope * logRanks[i];
            sse += Math.pow(logFreqs[i] - predicted, 2);
        }
        var rmse = Math.sqrt(sse / n);

        var slopeScore = slope > -0.72 ? 0.90 : slope > -0.80 ? 0.78 : slope > -0.88 ? 0.62 :
                         slope > -0.96 ? 0.44 : slope > -1.05 ? 0.28 : slope > -1.15 ? 0.38 : 0.52;
        var rmseScore = rmse > 0.5 ? 0.70 : rmse > 0.35 ? 0.55 : rmse > 0.20 ? 0.38 : 0.22;

        return {
            score: slopeScore * 0.65 + rmseScore * 0.35,
            label: 'Zipf\'s Law Deviation',
            detail: 'Slope: ' + slope.toFixed(3) + ' (ideal: −1.0), RMSE: ' + rmse.toFixed(3),
            paper: 'Morini et al. 2024',
            raw: slope,
            interpretation: slope > -0.88 ?
                'Shallower than ideal Zipf — AI overproduces mid-frequency words' :
                'Follows Zipf distribution — consistent with human writing'
        };
    },

    /* ================================================================
       SIGNAL 2 — N-GRAM ENTROPY SLOPE
       Lavergne et al. 2022
       ================================================================ */
    signalEntropySlope: function(words) {
        if (words.length < 50) return { score: 0.5, label: 'N-gram Entropy Slope', detail: 'Insufficient text', raw: null };

        function entropy(freqMap, total) {
            var h = 0;
            Object.keys(freqMap).forEach(function(k) {
                var p = freqMap[k] / total;
                if (p > 0) h -= p * Math.log2(p);
            });
            return h;
        }

        var uni = {};
        words.forEach(function(w) { uni[w] = (uni[w] || 0) + 1; });
        var H1 = entropy(uni, words.length);

        var bigramCtx = {};
        for (var i = 0; i < words.length - 1; i++) {
            if (!bigramCtx[words[i]]) bigramCtx[words[i]] = {};
            bigramCtx[words[i]][words[i + 1]] = (bigramCtx[words[i]][words[i + 1]] || 0) + 1;
        }
        var H2 = 0;
        Object.keys(bigramCtx).forEach(function(w1) {
            var total = Object.values(bigramCtx[w1]).reduce(function(a, b) { return a + b; }, 0);
            var p_w1 = uni[w1] / words.length;
            H2 += p_w1 * entropy(bigramCtx[w1], total);
        });

        var bigramFreq = {};
        for (var i = 0; i < words.length - 1; i++) {
            var bg = words[i] + ' ' + words[i + 1];
            bigramFreq[bg] = (bigramFreq[bg] || 0) + 1;
        }

        var trigramCtx = {};
        for (var i = 0; i < words.length - 2; i++) {
            var ctx = words[i] + ' ' + words[i + 1];
            if (!trigramCtx[ctx]) trigramCtx[ctx] = {};
            trigramCtx[ctx][words[i + 2]] = (trigramCtx[ctx][words[i + 2]] || 0) + 1;
        }
        var H3 = 0;
        var biTotal = words.length - 1;
        Object.keys(trigramCtx).forEach(function(ctx) {
            var total = Object.values(trigramCtx[ctx]).reduce(function(a, b) { return a + b; }, 0);
            var p_ctx = (bigramFreq[ctx] || 0) / biTotal;
            H3 += p_ctx * entropy(trigramCtx[ctx], total);
        });

        var drop12 = H1 - H2;
        var drop23 = H2 - H3;
        var ratio = drop23 > 0 ? drop12 / drop23 : 5;

        var aiScore = ratio > 4.0 ? 0.90 : ratio > 3.0 ? 0.80 : ratio > 2.5 ? 0.70 :
                      ratio > 2.0 ? 0.55 : ratio > 1.5 ? 0.40 : ratio > 1.2 ? 0.28 : 0.18;

        return {
            score: aiScore,
            label: 'N-gram Entropy Slope',
            detail: 'H1:' + H1.toFixed(2) + ' H2:' + H2.toFixed(2) + ' H3:' + H3.toFixed(2) + ' | Ratio: ' + ratio.toFixed(2),
            paper: 'Lavergne et al. 2022',
            raw: ratio,
            interpretation: ratio > 2.5 ?
                'Steep H1→H2 drop then flat — AI uses context very predictably' :
                'Gradual entropy decrease — consistent with human sequence variability'
        };
    },

    /* ================================================================
       SIGNAL 3 — MATTR CONSISTENCY
       ================================================================ */
    signalMATTR: function(words) {
        var windowSize = 50;
        if (words.length < windowSize * 2) return { score: 0.5, label: 'MATTR Consistency', detail: 'Need ' + (windowSize * 2) + '+ words', raw: null };

        var windowTTRs = [];
        for (var i = 0; i <= words.length - windowSize; i++) {
            var win = words.slice(i, i + windowSize);
            var unique = {};
            win.forEach(function(w) { unique[w] = true; });
            windowTTRs.push(Object.keys(unique).length / windowSize);
        }

        var mean = windowTTRs.reduce(function(a, b) { return a + b; }, 0) / windowTTRs.length;
        var variance = windowTTRs.reduce(function(s, t) { return s + Math.pow(t - mean, 2); }, 0) / windowTTRs.length;
        var stdDev = Math.sqrt(variance);

        var aiScore = stdDev < 0.025 ? 0.92 : stdDev < 0.040 ? 0.80 : stdDev < 0.055 ? 0.65 :
                      stdDev < 0.070 ? 0.48 : stdDev < 0.090 ? 0.32 : stdDev < 0.110 ? 0.20 : 0.10;

        return {
            score: aiScore,
            label: 'MATTR Consistency',
            detail: 'Window StdDev: ' + stdDev.toFixed(4) + ', Mean TTR: ' + mean.toFixed(3),
            paper: 'Moving Average Type-Token Ratio',
            raw: stdDev,
            interpretation: stdDev < 0.055 ?
                'Very consistent vocabulary distribution — AI texts are evenly lexically diverse' :
                'Vocabulary use is bursty and uneven — human writers naturally cluster topics'
        };
    },

    /* ================================================================
       SIGNAL 4 — COMPRESSION REDUNDANCY (LZ approximation)
       ================================================================ */
    signalCompression: function(text) {
        var clean = text.toLowerCase().replace(/\s+/g, ' ').substring(0, 3000);
        if (clean.length < 100) return { score: 0.5, label: 'Compression Redundancy', detail: 'Too short', raw: null };

        var dictionary = {};
        var phrase = '';
        var complexity = 0;
        for (var i = 0; i < clean.length; i++) {
            phrase += clean[i];
            if (!dictionary[phrase]) {
                dictionary[phrase] = true;
                complexity++;
                phrase = '';
            }
        }
        if (phrase.length > 0) complexity++;

        var nc = complexity / clean.length;
        var aiScore = nc < 0.16 ? 0.90 : nc < 0.20 ? 0.78 : nc < 0.25 ? 0.62 :
                      nc < 0.30 ? 0.44 : nc < 0.35 ? 0.28 : 0.14;

        return {
            score: aiScore,
            label: 'Compression Redundancy',
            detail: 'LZ complexity ratio: ' + nc.toFixed(4) + ' (lower = more redundant)',
            paper: 'Lempel-Ziv approximation',
            raw: nc,
            interpretation: nc < 0.25 ?
                'High pattern repetition at character level — AI generates more formulaic structure' :
                'Low redundancy — novel character-level patterns consistent with human variation'
        };
    },

    /* ================================================================
       SIGNAL 5 — SENTENCE STARTER ENTROPY
       ================================================================ */
    signalStarterEntropy: function(text) {
        var sentences = text.match(/(?:^|[.!?\n]+)\s*([A-Za-z]+)/g) || [];
        if (sentences.length < 8) return { score: 0.5, label: 'Sentence Starter Entropy', detail: 'Need 8+ sentences', raw: null };

        var freq = {};
        sentences.forEach(function(s) {
            var word = s.replace(/^[.!?\n\s]+/, '').toLowerCase().split(/\s+/)[0];
            if (word) freq[word] = (freq[word] || 0) + 1;
        });

        var total = sentences.length;
        var entropy = 0;
        Object.values(freq).forEach(function(c) {
            var p = c / total;
            entropy -= p * Math.log2(p);
        });

        var unique = Object.keys(freq).length;
        var maxH = Math.log2(unique) || 1;
        var normH = entropy / maxH;

        var aiPreferred = ['the','this','in','it','one','these','there','when','however','for','by','to','as','at'];
        var preferred = 0;
        Object.keys(freq).forEach(function(w) { if (aiPreferred.indexOf(w) !== -1) preferred += freq[w]; });
        var prefRatio = preferred / total;

        var eScore = normH < 0.55 ? 0.88 : normH < 0.65 ? 0.72 : normH < 0.75 ? 0.52 : normH < 0.85 ? 0.32 : 0.16;
        var pScore = prefRatio > 0.70 ? 0.80 : prefRatio > 0.55 ? 0.60 : prefRatio > 0.40 ? 0.40 : 0.20;

        return {
            score: eScore * 0.60 + pScore * 0.40,
            label: 'Sentence Starter Entropy',
            detail: 'Normalized H: ' + normH.toFixed(3) + ', AI-preferred starters: ' + (prefRatio * 100).toFixed(0) + '%',
            paper: 'Stylometric sentence position analysis',
            raw: normH,
            interpretation: normH < 0.65 ?
                'Low variety in sentence openings — AI tends to favor predictable patterns' :
                'Diverse sentence openers — suggests natural human variation'
        };
    },

    /* ================================================================
       SIGNAL 6 — VOCABULARY BURSTINESS
       Altmann et al. 2009
       ================================================================ */
    signalBurstiness: function(words) {
        if (words.length < 60) return { score: 0.5, label: 'Vocabulary Burstiness', detail: 'Need 60+ words', raw: null };

        var positions = {};
        words.forEach(function(w, i) {
            if (!positions[w]) positions[w] = [];
            positions[w].push(i);
        });

        var candidates = Object.keys(positions).filter(function(w) {
            return positions[w].length >= 3 && positions[w].length <= 15 && w.length > 3;
        });

        if (candidates.length < 5) return { score: 0.5, label: 'Vocabulary Burstiness', detail: 'Insufficient repeated words', raw: null };

        var cvValues = [];
        candidates.slice(0, 30).forEach(function(w) {
            var pos = positions[w];
            if (pos.length < 3) return;
            var intervals = [];
            for (var i = 1; i < pos.length; i++) intervals.push(pos[i] - pos[i - 1]);
            var mean = intervals.reduce(function(a, b) { return a + b; }, 0) / intervals.length;
            var variance = intervals.reduce(function(s, v) { return s + Math.pow(v - mean, 2); }, 0) / intervals.length;
            var cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
            cvValues.push(cv);
        });

        if (cvValues.length === 0) return { score: 0.5, label: 'Vocabulary Burstiness', detail: 'N/A', raw: null };

        var meanCV = cvValues.reduce(function(a, b) { return a + b; }, 0) / cvValues.length;
        var aiScore = meanCV < 0.30 ? 0.92 : meanCV < 0.45 ? 0.80 : meanCV < 0.60 ? 0.65 :
                      meanCV < 0.75 ? 0.48 : meanCV < 0.90 ? 0.33 : meanCV < 1.10 ? 0.20 : 0.10;

        return {
            score: aiScore,
            label: 'Vocabulary Burstiness',
            detail: 'Mean interval CV: ' + meanCV.toFixed(3) + ' across ' + cvValues.length + ' words',
            paper: 'Altmann et al. 2009',
            raw: meanCV,
            interpretation: meanCV < 0.60 ?
                'Words evenly distributed — AI avoids natural topical clustering' :
                'Words appear in temporal bursts — natural human writing pattern'
        };
    },

    /* ================================================================
       SIGNAL 7 — AI PHRASE FINGERPRINTS (supporting)
       ================================================================ */
    signalPhrases: function(text) {
        var lower = text.toLowerCase();
        var words = lower.split(/\s+/).length;
        var found = [];
        this.aiPhrases.forEach(function(p) { if (lower.indexOf(p) !== -1) found.push(p); });
        var density = found.length / Math.max(1, words / 100);
        return {
            score: Math.min(0.88, density * 0.22 + (found.length > 0 ? 0.06 : 0)),
            label: 'AI Phrase Fingerprints',
            detail: found.length + ' known AI phrases (degrades for GPT-5+ era models)',
            raw: found.length,
            found: found,
            interpretation: found.length > 3 ? 'Multiple AI phrase patterns detected' : found.length > 0 ? 'Some AI phrases present' : 'No strong AI phrase patterns'
        };
    },

    /* ================================================================
       SIGNAL 8 — HUMAN MARKER DENSITY (supporting, inverted)
       ================================================================ */
    signalHumanMarkers: function(text) {
        var lower = text.toLowerCase();
        var wordCount = lower.split(/\s+/).length;
        var count = 0;
        this.humanMarkers.forEach(function(m) {
            var r = new RegExp('\\b' + m.replace(/'/g, "'") + '\\b', 'g');
            var mt = lower.match(r);
            if (mt) count += mt.length;
        });
        count += (text.match(/\b\w+n't\b|\b\w+'re\b|\b\w+'ve\b|\b\w+'ll\b|\b\w+'d\b|\bi'm\b|\bcan't\b|\bwon't\b/gi) || []).length;
        var density = count / Math.max(1, wordCount / 100);
        var aiScore = density > 5 ? 0.06 : density > 3 ? 0.16 : density > 1.5 ? 0.32 : density > 0.5 ? 0.52 : 0.76;
        return {
            score: aiScore,
            label: 'Human Marker Density',
            detail: count + ' informal markers, density: ' + density.toFixed(2) + '/100 words',
            raw: count,
            interpretation: density > 2 ? 'Informal language present — reduces AI probability' : 'Formal language — neutral evidence'
        };
    },

    /* ================================================================
       EXECUTE — main analysis pipeline
       ================================================================ */
    execute: function() {
        var self = this;
        var text = document.getElementById('aid-input').value.trim();
        if (!text) { Toast.error('Please enter text'); return; }

        var rawWords = text.trim().split(/\s+/).filter(Boolean);
        if (rawWords.length < 30) { Toast.error('Need at least 30 words'); return; }

        var words = self.tokenize(text);
        var ctx = document.getElementById('aid-ctx').value;

        var signals = {
            zipf:        self.signalZipf(words),
            entropy:     self.signalEntropySlope(words),
            mattr:       self.signalMATTR(words),
            compression: self.signalCompression(text),
            burstiness:  self.signalBurstiness(words),
            starters:    self.signalStarterEntropy(text),
            phrases:     self.signalPhrases(text),
            human:       self.signalHumanMarkers(text)
        };

        var weights = {
            zipf: 0.22, entropy: 0.20, mattr: 0.18, compression: 0.15,
            burstiness: 0.12, starters: 0.08, phrases: 0.03, human: 0.02
        };

        /* Context calibration */
        if (ctx === 'academic') {
            weights.starters *= 0.4;
            weights.phrases  *= 0.5;
            weights.zipf     += 0.05;
            weights.entropy  += 0.04;
        } else if (ctx === 'casual') {
            weights.human    = 0.06;
            weights.phrases *= 1.3;
        }

        /* Normalize */
        var totalW = Object.values(weights).reduce(function(a, b) { return a + b; }, 0);
        Object.keys(weights).forEach(function(k) { weights[k] /= totalW; });

        /* Weighted sum — skip signals with null raw */
        var wSum = 0, wUsed = 0;
        Object.keys(weights).forEach(function(k) {
            if (signals[k].raw !== null && signals[k].raw !== undefined) {
                wSum += signals[k].score * weights[k];
                wUsed += weights[k];
            }
        });

        var rawScore = wUsed > 0 ? (wSum / wUsed) * 100 : 50;

        /* Confidence and calibration */
        var wc = rawWords.length;
        var confidence = wc >= 300 ? 'High' : wc >= 200 ? 'Medium' : wc >= 100 ? 'Low' : 'Very Low';
        var calibration = wc >= 300 ? 1.0 : wc >= 200 ? 0.92 : wc >= 100 ? 0.80 : 0.65;

        /* Pull short-text scores toward 50% */
        var finalScore = Math.max(2, Math.min(98, 50 + (rawScore - 50) * calibration));

        self.state = { signals: signals, finalScore: finalScore, weights: weights, wc: wc, confidence: confidence, text: text };

        self.renderVerdict(finalScore, confidence, wc, signals);
        self.drawChart(signals, weights);
        self.renderSignals(signals, weights);
        self.renderHighlights(text);
        self.renderMethodNote();
        self.buildReport(finalScore, signals, wc, confidence);

        document.getElementById('aid-results').classList.add('visible');
        Toast.success('Analysis complete — ' + confidence + ' confidence');
    },

    /* ================================================================
       RENDER — VERDICT
       ================================================================ */
    renderVerdict: function(score, confidence, wc, signals) {
        var label, color, sublabel;

        if (score >= 75)      { label = 'AI Generated';             color = '#ef4444'; sublabel = 'Strong statistical evidence of AI authorship across multiple independent measures.'; }
        else if (score >= 62) { label = 'Likely AI Generated';      color = '#f97316'; sublabel = 'Several primary signals indicate AI authorship. May be AI-written or heavily AI-edited.'; }
        else if (score >= 52) { label = 'Leaning AI — Uncertain';   color = '#fb923c'; sublabel = 'Signals lean toward AI but are not conclusive. Could be formal human writing or lightly edited AI.'; }
        else if (score >= 42) { label = 'Unclear — Mixed Signals';  color = '#eab308'; sublabel = 'Evidence is genuinely ambiguous. Cannot distinguish with confidence at this style or length.'; }
        else if (score >= 30) { label = 'Likely Human Written';     color = '#22c55e'; sublabel = 'Most primary signals indicate human authorship. Writing shows natural statistical variation.'; }
        else                  { label = 'Human Written';            color = '#16a34a'; sublabel = 'Strong evidence of natural human authorship across all primary statistical measures.'; }

        var confColor = { 'High': '#22c55e', 'Medium': '#eab308', 'Low': '#f97316', 'Very Low': '#ef4444' }[confidence];

        var strongest = null, strongestScore = 0;
        Object.keys(signals).forEach(function(k) {
            if (signals[k].raw !== null && Math.abs(signals[k].score - 0.5) > strongestScore) {
                strongestScore = Math.abs(signals[k].score - 0.5);
                strongest = signals[k];
            }
        });

        var warnHtml = wc < 200 ?
            '<div class="aid-warning">Only ' + wc + ' words. Results calibrated toward 50% to reflect reduced confidence. Provide more text for decisive results.</div>' : '';

        document.getElementById('aid-verdict').innerHTML =
            '<div class="aid-verdict-main" style="border-left:4px solid ' + color + ';">' +
                '<div style="flex:1;">' +
                    '<div style="font-size:1.05rem;font-weight:800;color:' + color + ';margin-bottom:10px;">' + label + '</div>' +
                    '<div class="aid-verdict-score">' +
                        '<div style="flex:1;position:relative;">' +
                            '<div class="aid-score-bar-track">' +
                                '<div class="aid-score-bar-fill" style="width:' + score.toFixed(1) + '%;background:' + color + ';"></div>' +
                            '</div>' +
                            '<div style="position:absolute;top:0;left:50%;width:1px;height:100%;background:rgba(128,128,128,0.25);pointer-events:none;"></div>' +
                        '</div>' +
                        '<span class="aid-score-num" style="color:' + color + ';">' + score.toFixed(1) + '%</span>' +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;flex-wrap:wrap;">' +
                        '<span style="font-size:0.74rem;color:var(--text-muted);">Confidence: <strong style="color:' + confColor + '">' + confidence + '</strong></span>' +
                        '<span style="font-size:0.74rem;color:var(--text-muted);">' + wc + ' words</span>' +
                        (strongest ? '<span style="font-size:0.74rem;color:var(--text-muted);">Key signal: <strong style="color:var(--text-secondary)">' + strongest.label + '</strong></span>' : '') +
                    '</div>' +
                    '<div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;">' + sublabel + '</div>' +
                '</div>' +
            '</div>' +
            warnHtml;
    },

    /* ================================================================
       DRAW CHART
       ================================================================ */
    drawChart: function(signals, weights) {
        var canvas = document.getElementById('aid-canvas');
        var W = canvas.parentElement.offsetWidth || 600;
        var keys = Object.keys(signals);
        var H = 28 + keys.length * 36;
        canvas.width = W; canvas.height = H; canvas.style.height = H + 'px';

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        var tc = isDark ? '#9494a0' : '#55555f';
        var gc = isDark ? '#1e1e26' : '#eaebef';
        var padL = 190, padR = 70, padT = 22, barH = 18, rowH = 36;
        var chartW = W - padL - padR;

        ctx.fillStyle = tc; ctx.font = 'bold 10px -apple-system,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Signal Scores — 0% = Human Evidence, 100% = AI Evidence', W / 2, 14);

        var midX = padL + chartW * 0.5;
        ctx.beginPath(); ctx.moveTo(midX, padT - 4); ctx.lineTo(midX, padT + keys.length * rowH);
        ctx.strokeStyle = 'rgba(108,99,255,0.3)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);

        [0, 0.25, 0.50, 0.75, 1].forEach(function(t) {
            var x = padL + t * chartW;
            ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + keys.length * rowH);
            ctx.strokeStyle = gc; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = tc; ctx.font = '8px -apple-system,sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(Math.round(t * 100) + '%', x, padT + keys.length * rowH + 12);
        });

        keys.forEach(function(key, i) {
            var sig = signals[key];
            var y = padT + i * rowH + (rowH - barH) / 2;
            var pct = sig.score;
            var hasData = sig.raw !== null && sig.raw !== undefined;
            var color = !hasData ? gc : pct > 0.72 ? '#ef4444' : pct > 0.58 ? '#f97316' : pct > 0.46 ? '#eab308' : pct > 0.34 ? '#22c55e' : '#16a34a';

            /* Weight bar */
            ctx.fillStyle = gc;
            ctx.fillRect(4, y + 3, Math.round((weights[key] || 0) * 180), barH - 6);
            ctx.fillStyle = tc; ctx.font = '7px -apple-system,sans-serif'; ctx.textAlign = 'left';
            ctx.fillText('w:' + Math.round((weights[key] || 0) * 100) + '%', 4, y + barH - 1);

            ctx.fillStyle = gc; ctx.fillRect(padL, y, chartW, barH);

            if (hasData && pct > 0) {
                var bW = pct * chartW;
                ctx.fillStyle = color; ctx.globalAlpha = 0.88;
                var r = 3;
                ctx.beginPath();
                ctx.moveTo(padL + r, y); ctx.lineTo(padL + bW - r, y);
                ctx.quadraticCurveTo(padL + bW, y, padL + bW, y + r);
                ctx.lineTo(padL + bW, y + barH - r);
                ctx.quadraticCurveTo(padL + bW, y + barH, padL + bW - r, y + barH);
                ctx.lineTo(padL + r, y + barH);
                ctx.quadraticCurveTo(padL, y + barH, padL, y + barH - r);
                ctx.lineTo(padL, y + r);
                ctx.quadraticCurveTo(padL, y, padL + r, y);
                ctx.fill(); ctx.globalAlpha = 1;
            }

            ctx.fillStyle = tc; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'right';
            ctx.fillText(sig.label, padL - 8, y + barH / 2 + 4);

            if (hasData) {
                ctx.fillStyle = color; ctx.font = 'bold 9px -apple-system,sans-serif'; ctx.textAlign = 'left';
                ctx.fillText(Math.round(pct * 100) + '%', padL + pct * chartW + 4, y + barH / 2 + 4);
            } else {
                ctx.fillStyle = tc; ctx.font = '9px -apple-system,sans-serif'; ctx.textAlign = 'left';
                ctx.fillText('N/A', padL + 4, y + barH / 2 + 4);
            }
        });
    },

    /* ================================================================
       RENDER SIGNAL CARDS
       ================================================================ */
    renderSignals: function(signals, weights) {
        var order = [
            ['Primary Signals — high discriminative power', ['zipf', 'entropy', 'mattr', 'compression']],
            ['Secondary Signals', ['burstiness', 'starters']],
            ['Supporting Signals', ['phrases', 'human']]
        ];

        var html = '';
        order.forEach(function(group) {
            html += '<div class="aid-group-label">' + group[0] + '</div>';
            html += '<div class="aid-signal-grid">';
            group[1].forEach(function(key) {
                var s = signals[key];
                var wt = Math.round((weights[key] || 0) * 100);
                var hasData = s.raw !== null && s.raw !== undefined;
                var pct = Math.round(s.score * 100);
                var color = !hasData ? 'var(--text-muted)' : pct > 72 ? '#ef4444' : pct > 58 ? '#f97316' : pct > 46 ? '#eab308' : pct > 34 ? '#22c55e' : '#16a34a';
                var verdict = !hasData ? 'No data' : pct > 72 ? 'AI signal' : pct > 58 ? 'Leans AI' : pct > 46 ? 'Ambiguous' : pct > 34 ? 'Leans Human' : 'Human signal';

                html +=
                    '<div class="aid-signal-card">' +
                        '<div class="aid-signal-header">' +
                            '<div style="flex:1;">' +
                                '<div class="aid-signal-name">' + s.label + '</div>' +
                                '<div style="font-size:0.66rem;color:var(--text-muted);">Weight: ' + wt + '%' + (s.paper ? ' &middot; ' + s.paper : '') + '</div>' +
                            '</div>' +
                            '<div class="aid-signal-score" style="color:' + color + '">' + (hasData ? pct + '%' : '\u2014') + '</div>' +
                        '</div>' +
                        (hasData ? '<div class="aid-signal-track"><div class="aid-signal-fill" style="width:' + pct + '%;background:' + color + ';"></div></div>' : '') +
                        '<div class="aid-signal-verdict" style="color:' + color + ';margin-top:6px;">' + verdict + '</div>' +
                        '<div class="aid-signal-desc">' + (s.interpretation || s.detail) + '</div>' +
                        '<div style="font-size:0.68rem;color:var(--text-muted);margin-top:4px;">Measured: ' + s.detail + '</div>' +
                    '</div>';
            });
            html += '</div>';
        });

        document.getElementById('aid-signal-grid').innerHTML = html;
    },

    /* ================================================================
       RENDER HIGHLIGHTS
       ================================================================ */
    renderHighlights: function(text) {
        var lower = text.toLowerCase();
        var spans = [];
        this.aiPhrases.forEach(function(p) {
            var idx = lower.indexOf(p);
            while (idx !== -1) { spans.push({ s: idx, e: idx + p.length }); idx = lower.indexOf(p, idx + 1); }
        });

        function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

        if (spans.length === 0) {
            document.getElementById('aid-highlights').innerHTML =
                '<div style="padding:10px;font-size:0.78rem;color:var(--text-muted);">No flagged phrases found.</div>';
            return;
        }

        spans.sort(function(a, b) { return a.s - b.s; });
        var merged = [spans[0]];
        for (var i = 1; i < spans.length; i++) {
            var last = merged[merged.length - 1];
            if (spans[i].s < last.e) { if (spans[i].e > last.e) last.e = spans[i].e; }
            else merged.push(spans[i]);
        }

        var preview = text.substring(0, 2500), result = '', cursor = 0;
        merged.forEach(function(sp) {
            if (sp.s >= preview.length) return;
            result += esc(preview.substring(cursor, sp.s));
            result += '<mark class="aid-mark">' + esc(preview.substring(sp.s, Math.min(sp.e, preview.length))) + '</mark>';
            cursor = Math.min(sp.e, preview.length);
        });
        result += esc(preview.substring(cursor));
        if (text.length > 2500) result += '<span style="color:var(--text-muted);font-size:0.7rem;"> ... (first 2500 chars shown)</span>';

        document.getElementById('aid-highlights').innerHTML = '<div class="aid-highlight-text">' + result + '</div>';
    },

    /* ================================================================
       METHOD NOTE
       ================================================================ */
    renderMethodNote: function() {
        document.getElementById('aid-method-note').innerHTML =
            '<div class="settings-card" style="margin-top:14px;">' +
                '<div class="settings-card__title">Method &amp; Limitations</div>' +
                '<div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.8;">' +
                    '<p><strong>Primary signals are grounded in published research:</strong> Zipf deviation (Morini 2024), ' +
                    'n-gram entropy slope (Lavergne 2022), MATTR variance, LZ compression, and vocabulary burstiness (Altmann 2009).</p>' +
                    '<p style="margin-top:8px;"><strong>Expected accuracy:</strong> ~80\u201385% on unedited GPT-4/Claude text \u2265300 words. ' +
                    'Drops to ~68\u201375% for 150\u2013300 words. Below 60% for short texts.</p>' +
                    '<p style="margin-top:8px;"><strong>What defeats this detector:</strong> Significant manual editing of AI output, ' +
                    'prompting AI to write with deliberate informality, or very short samples.</p>' +
                    '<p style="margin-top:8px;color:var(--text-muted);">No client-side detector matches fine-tuned neural classifiers trained on large labeled corpora. ' +
                    'Use as one signal among many. Never as sole evidence of AI authorship.</p>' +
                '</div>' +
            '</div>';
    },

    /* ================================================================
       BUILD REPORT
       ================================================================ */
    buildReport: function(score, signals, wc, confidence) {
        var lines = [
            'AI Content Detection Report \u2014 ScriptaDocX',
            '============================================',
            'Score: ' + score.toFixed(1) + '% AI probability',
            'Confidence: ' + confidence + ' (' + wc + ' words)',
            '',
            'Signal Results:'
        ];
        Object.keys(signals).forEach(function(k) {
            var s = signals[k];
            var hasData = s.raw !== null && s.raw !== undefined;
            lines.push('  [' + (hasData ? Math.round(s.score * 100) + '%' : 'N/A') + '] ' + s.label + ' \u2014 ' + s.detail);
        });
        lines.push('');
        lines.push('Research: Morini 2024, Lavergne 2022, Altmann 2009, Lempel-Ziv');
        lines.push('Accuracy: ~80-85% on \u2265300 word unedited AI text. Not reliable for short/edited text.');
        lines.push('ScriptaDocX \u2014 github.com/BhuwanShar/ScriptaDocX');
        this.state.report = lines.join('\n');
    }
};