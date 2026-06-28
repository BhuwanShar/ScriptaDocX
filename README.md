<div align="center">

<img src="assets/favicon.svg" width="64" height="64" alt="ScriptaDocX Logo">

# ScriptaDocX

**Free, open-source document and text analysis toolkit that runs entirely in your browser.**

No servers. No uploads. No sign-ups. Your files never leave your device.

[![License: MIT](https://img.shields.io/badge/License-MIT-6c63ff.svg)](https://opensource.org/licenses/MIT)
![Version](https://img.shields.io/badge/Version-0.2.0-6c63ff.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

[**Live Demo →**](https://bhuwanshar.github.io/ScriptaDocX/)
&nbsp;·&nbsp;
[Report Bug](https://github.com/BhuwanShar/ScriptaDocX/issues/new?template=bug_report.md)
&nbsp;·&nbsp;
[Request Feature](https://github.com/BhuwanShar/ScriptaDocX/issues/new?template=feature_request.md)

</div>

---

## What is ScriptaDocX?

ScriptaDocX is a fully client-side toolkit for working with PDFs, images, and text — all inside your browser window. There is no backend server. When you upload a file, it never leaves your computer. Every tool processes data locally using modern browser APIs and WebAssembly.

It was built as a free alternative to paid services like iLovePDF, with the added dimension of text mining and analysis tools that most document platforms do not offer.

**Built with:** plain HTML, CSS, and vanilla JavaScript. No frameworks. No build tools. No installation.

---

## Changelog

### v0.0.3 — AI Content Detector
- Added AI Content Detector with 8 research-based statistical signals
- Zipf's Law deviation analysis (Morini et al. 2024)
- N-gram entropy slope measurement (Lavergne et al. 2022)
- Moving Average Type-Token Ratio (MATTR) consistency scoring
- Lempel-Ziv compression redundancy approximation
- Vocabulary burstiness analysis (Altmann et al. 2009)
- Sentence starter entropy measurement
- AI phrase fingerprint scanner
- Human marker density (inverted signal)
- Full signal breakdown chart and flagged phrase highlighter
- Mandatory disclaimer modal built into the tool — no external files

## Changelog

### v0.0.2 — Text Mining Suite
- Added Word Frequency Analyzer with bar, horizontal, and pie charts
- Added Sentiment Analysis with timeline and distribution charts
- Added TF-IDF Analyzer with heatmap and bar chart
- Added Readability Report with radar chart (5 metrics)
- Added Text Cleaner with 9 configurable operations
- All charts rendered via Canvas API — no external charting libraries

### v0.0.1 — Document Toolkit
- PDF Compression, OCR, Merge, Split, Rotate
- Watermark, Page Numbers, Metadata Editor
- PDF to Images, Images to PDF, Image Compression
- Dark and light mode
- Responsive mobile layout

---

## Features

### PDF Tools

| Tool | What it does | When to use it |
|---|---|---|
| **Compress PDF** | Re-renders pages as optimized JPEG images to reduce file size | When a PDF is too large to email or upload |
| **OCR — Extract Text** | Reads text from scanned or image-based PDFs using Tesseract.js | When you need to copy text from a scanned document |
| **Merge PDFs** | Combines multiple PDFs into one file in any order | When combining reports, chapters, or invoices |
| **Split PDF** | Extracts specific pages into a new PDF | When you only need certain pages from a large document |
| **Rotate Pages** | Rotates all or selected pages by 90°, 180°, or 270° | When scanned pages appear sideways |
| **Add Watermark** | Stamps diagonal text across every page | When marking documents as confidential or draft |
| **Add Page Numbers** | Numbers every page at a configurable position | When preparing reports or submissions |
| **Edit Metadata** | Changes the title, author, subject, and keywords stored inside the PDF | When cleaning up document properties before sharing |

### Image Tools

| Tool | What it does | When to use it |
|---|---|---|
| **PDF to Images** | Converts each PDF page into a PNG or JPEG file | When you need images of document pages |
| **Images to PDF** | Combines multiple images into one PDF | When consolidating photos or scans |
| **Compress Image** | Reduces image file size by adjusting quality and dimensions | When images are too large to upload or share |

### Text Mining Tools

| Tool | What it does | When to use it |
|---|---|---|
| **Word Frequency** | Counts and ranks every word, produces bar and pie charts | When you want to understand what a document is mostly about |
| **Sentiment Analysis** | Scores each sentence as positive, negative, or neutral | When analyzing reviews, feedback, or social content |
| **TF-IDF Analyzer** | Identifies the most important keywords across multiple documents | When comparing articles, reports, or research papers |
| **Readability Report** | Scores text across five established readability formulas | When checking if writing is appropriate for your audience |
| **Text Cleaner** | Removes noise: extra spaces, URLs, emails, special characters | When preparing text for analysis or publication |

---

## How Each Tool Works

This section explains the underlying method behind every tool so you know exactly what is happening to your data.

---

### PDF Compression

**Method:** Each page of the PDF is rendered to an HTML canvas element using PDF.js, then saved as a JPEG image at the quality level you choose. A new PDF is built from those images using pdf-lib.

**Trade-off:** Text becomes rasterized (it is an image of text, not selectable text). This is acceptable for sharing but not ideal if the recipient needs to edit or copy text.

**Settings guide:**

| Setting | Effect |
|---|---|
| Quality 0.1–0.3 | Maximum compression, noticeable quality loss |
| Quality 0.4–0.6 | Good balance of size and quality |
| Quality 0.7–0.95 | Near-original quality, modest size reduction |
| Scale 0.5–1x | Lower resolution, smaller file |
| Scale 1.5–2x | Higher resolution, larger file |

**When compression makes the file larger:** If the original PDF is already highly optimized (vector graphics, embedded fonts, no images), re-rendering as JPEG may produce a larger file. In this case the tool will notify you.

---

### OCR — Extract Text

**What OCR means:** Optical Character Recognition. The tool takes a visual image of text and converts it to machine-readable characters.

**Method:** Each PDF page is rendered to a canvas at your chosen scale. That canvas image is passed to Tesseract.js, which runs a trained neural network to recognize characters. The output is plain text.

**Language packs:** Tesseract downloads a language data file (~4 MB) on first use for each language. This is cached in the browser.

**Settings guide:**

| Setting | Recommendation |
|---|---|
| Scale 1x | Fast, lower accuracy |
| Scale 2x | Good balance — recommended default |
| Scale 3–4x | Best accuracy, slowest |

**Accuracy tips:**
- Straight, well-lit scans produce the best results
- Blurry or skewed documents will produce poor output
- Handwritten text is not supported
- Tables and complex layouts may not preserve structure

---

### Merge PDFs

**Method:** pdf-lib reads each uploaded PDF, copies its pages, and inserts them in order into a new blank PDF document.

**Notes:**
- Password-protected PDFs cannot be merged without the password
- The order of files in the list is the order in the final document
- There is no page limit but very large files may be slow due to browser memory

---

### Split PDF

**Method:** pdf-lib loads the source PDF, copies only the pages you specify, and saves them into a new document.

**Page range syntax:**

```
1-5        → pages 1 through 5
1,3,7      → pages 1, 3, and 7 only
1-3,5,8-10 → pages 1,2,3,5,8,9,10
```

---

### Watermark

**Method:** pdf-lib embeds Helvetica text directly onto each page as a PDF drawing instruction. The text is not a separate layer — it is burned into the page content.

**Settings guide:**

| Setting | Typical value |
|---|---|
| Opacity | 0.10–0.20 for subtle, 0.30–0.50 for visible |
| Rotation | −45° is the standard diagonal watermark |
| Font size | 40–80 for A4 pages |

---

### Word Frequency

**Method:** The text is lowercased, punctuation is removed, and it is split into individual tokens (words). Each token is counted. Optionally, common stop words (the, is, and, etc.) are filtered out before counting.

**Stop words** are extremely common words that carry little meaning on their own. Removing them lets you focus on words that are more specific to the content.

**Metrics explained:**

| Metric | What it means |
|---|---|
| Total words | Raw count of all tokens after filtering |
| Unique words | Number of distinct word types |
| Lexical diversity | Unique ÷ Total × 100 — higher means richer vocabulary |
| Avg word length | Mean number of characters per word |

**Chart types:**
- **Bar chart** — Compare frequency of top words vertically
- **Horizontal bar** — Better for long word labels
- **Pie chart** — Shows proportion of top 10 words as share of total

---

### Sentiment Analysis

**Method:** This tool uses a **lexicon-based approach**. Each word in the text is looked up in a pre-built dictionary (based on AFINN-165) that assigns a score from −5 (very negative) to +5 (very positive).

**Formula:**

```
Sentence score = sum of scores of all scored words in that sentence

Overall score  = total score ÷ number of sentences
```

**Negation handling:** Words like *not*, *never*, *no*, *can't*, *didn't* flip the sign of the next scored word. Example: "not good" scores −2.25 instead of +3.

**Intensifier handling:** Words like *very*, *extremely*, *absolutely* multiply the next word's score by 1.5. Example: "very bad" scores −4.5 instead of −3.

**Sentiment labels:**

| Score range | Label |
|---|---|
| > 2.0 | Very Positive |
| 0.5 to 2.0 | Positive |
| −0.5 to 0.5 | Neutral |
| −2.0 to −0.5 | Negative |
| < −2.0 | Very Negative |

**Limitations:**
- Sarcasm and irony are not detected
- Domain-specific language (legal, medical, technical) may score incorrectly
- Short texts (under 3 sentences) produce less reliable results
- The lexicon covers English only

**Chart types:**
- **Timeline** — Plots sentiment score for each sentence in sequence, revealing how tone changes through the text
- **Distribution** — Shows how many sentences fall into each sentiment category

**When to use this tool:**
- Analyzing customer reviews
- Checking the tone of a written draft
- Comparing feedback from different sources
- Tracking sentiment across sections of a long document

---

### TF-IDF Analyzer

**What TF-IDF means:** Term Frequency — Inverse Document Frequency. It is a numerical statistic used in information retrieval and NLP to reflect how important a word is to a document within a collection of documents.

**The problem it solves:** A word like *the* appears very frequently in every document, so raw frequency is not a useful signal. TF-IDF downweights words that appear everywhere and upweights words that are distinctive to specific documents.

**Formula:**

```
TF(word, document)  = count of word in document ÷ total words in document

IDF(word, all docs) = log( (N + 1) ÷ (docs containing word + 1) ) + 1
                      where N = total number of documents

TF-IDF = TF × IDF
```

**Interpretation:**

| TF-IDF score | Meaning |
|---|---|
| High score | Word is frequent in this document but rare across others → distinctive keyword |
| Low score | Word appears in most documents → generic, less informative |
| Score of 0 | Word does not appear in this document |

**How to prepare input:**
- Separate paragraphs with a blank line — each paragraph becomes one document
- Or choose "Sentences" to treat each sentence as a document
- For best results, provide at least 3–5 meaningful paragraphs

**Chart types:**
- **Heatmap** — Grid of documents × top keywords. Darker cells = higher TF-IDF score. Quickly shows which words are distinctive to which documents
- **Bar chart** — Ranked TF-IDF scores for the top keywords in the first document

**When to use this tool:**
- Finding the key themes in each section of a long report
- Comparing multiple articles or research abstracts
- Extracting keywords for SEO or tagging
- Understanding what makes each document unique in a collection

---

### Readability Report

**What readability means:** A measure of how easy or difficult a piece of writing is to read and understand, based on sentence length and word complexity.

**The five formulas used:**

#### 1. Flesch Reading Ease
```
Score = 206.835
      − (1.015 × average sentence length)
      − (84.6 × average syllables per word)
```

Higher score = easier to read.

| Score | Level | Typical audience |
|---|---|---|
| 90–100 | Very Easy | 5th grade, everyday conversation |
| 80–90 | Easy | 6th grade, fiction |
| 70–80 | Fairly Easy | 7th grade |
| 60–70 | Standard | 8th–9th grade, general public |
| 50–60 | Fairly Difficult | 10th–12th grade |
| 30–50 | Difficult | College level |
| 0–30 | Very Difficult | Professional / academic |

#### 2. Flesch-Kincaid Grade Level
```
Grade = (0.39 × average sentence length)
      + (11.8 × average syllables per word)
      − 15.59
```

Output is a US school grade level. Grade 8 means an average 8th grader can understand it.

#### 3. Gunning Fog Index
```
Fog = 0.4 × (average sentence length + percentage of complex words)
```

Complex words = words with 3 or more syllables. Output is a grade level. A score above 17 is considered unreadable by most audiences.

#### 4. SMOG Grade
```
SMOG = 3 + √(complex word count × 30 ÷ sentence count)
```

Designed specifically for health information. Recommended for medical and public health writing.

#### 5. Coleman-Liau Index
```
L = (characters ÷ words) × 100
S = (sentences ÷ words) × 100

CLI = (0.0588 × L) − (0.296 × S) − 15.8
```

Unlike the other formulas, this one uses character count rather than syllables, making it useful for languages where syllable counting is difficult.

**Radar chart:** All five scores are normalized to a 0–100 scale and plotted as a pentagon. A wider polygon toward the outer edge means higher readability across all metrics.

**When to use this tool:**
- Before publishing an article or report, check it matches your audience
- Academic writing — aim for grade 12–16 depending on field
- General web content — aim for grade 8 or below
- Medical or legal documents — use SMOG and Flesch to ensure accessibility

---

### Text Cleaner

**Method:** A sequential pipeline of text transformations applied in order to the input text. Each step is optional and configurable.

**Operations in order:**

| Step | What it removes or changes |
|---|---|
| Remove URLs | Deletes anything matching `http://` or `https://` patterns |
| Remove emails | Deletes patterns matching `word@domain.tld` |
| Remove numbers | Deletes standalone numeric tokens |
| Remove special characters | Keeps only letters, numbers, and basic punctuation |
| Fix double punctuation | Collapses `!!` or `...` into single punctuation marks |
| Remove extra spaces | Collapses multiple consecutive spaces into one |
| Trim line whitespace | Removes leading and trailing spaces from each line |
| Remove extra blank lines | Collapses 3+ consecutive blank lines into 2 |
| Case conversion | Converts entire text to chosen case |

**When to use this tool:**
- Cleaning scraped web content before analysis
- Normalizing text before feeding into Word Frequency or TF-IDF
- Removing OCR artifacts from extracted text
- Preparing social media data for sentiment analysis

---

## Privacy

Everything runs locally. The breakdown:

| What happens | Where it happens |
|---|---|
| PDF rendering | Browser (PDF.js) |
| PDF modification | Browser (pdf-lib) |
| OCR | Browser (Tesseract.js via WebAssembly) |
| Text analysis | Browser (vanilla JavaScript) |
| Chart rendering | Browser (HTML Canvas API) |
| File storage | Never — files exist only in memory during the session |

The application makes no network requests except to load the JavaScript libraries from CDN on first load. After that, it functions entirely offline.

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| [PDF.js](https://mozilla.github.io/pdf.js/) | 3.11.174 | Render PDF pages to canvas |
| [pdf-lib](https://pdf-lib.js.org/) | latest | Create and modify PDF documents |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | 5.x | OCR via WebAssembly |
| Canvas API | Native | All chart rendering |
| HTML5 / CSS3 / JS | Native | Everything else |

No frameworks. No bundlers. No Node.js required.

---

## Project Structure

```
ScriptaDocX/
│
├── index.html
├── assets/
│   └── favicon.svg
│
├── css/
│   ├── style.css          # Core layout, theme variables
│   ├── components.css     # UI components: cards, buttons, forms, charts
│   └── animations.css     # Keyframes, easing, transitions
│
└── js/
    ├── utils.js           # Shared helpers
    ├── toast.js           # Notification system
    ├── theme.js           # Dark/light mode
    ├── router.js          # View navigation
    ├── app.js             # App initialization, tool registry
    │
    └── tools/
        ├── compress.js
        ├── ocr.js
        ├── merge.js
        ├── split.js
        ├── rotate.js
        ├── watermark.js
        ├── pagenums.js
        ├── metadata.js
        ├── pdftoimg.js
        ├── imgtopdf.js
        ├── imgcompress.js
        ├── wordfreq.js
        ├── sentiment.js
        ├── tfidf.js
        ├── readability.js
        └── textclean.js
```

---

## Adding a New Tool

Every tool follows the same self-contained object pattern:

```javascript
var MyTool = {
    id: 'mytool',           // Unique string ID used in routing
    name: 'My Tool',        // Displayed in the UI
    description: '...',     // Subtitle shown in tool header
    icon: '<svg>...</svg>', // Inline SVG — no emoji, no icon fonts
    category: 'pdf',        // 'pdf', 'img', or 'text'
    state: {},              // Tool-local data (reset on each render)

    render: function(container) {
        // Build all HTML into container
        // Attach all event listeners
    },

    execute: function() {
        // Core processing logic
    }
};
```

**To register it:**

1. Create `js/tools/mytool.js`
2. Add `<script src="js/tools/mytool.js"></script>` in `index.html` before `app.js`
3. Add `this.registerTool(MyTool);` in the `init` function in `app.js`

The home grid, header navigation, and mobile menu all populate automatically.

---

## Getting Started

### Use Online

[https://bhuwanshar.github.io/Documents/](https://bhuwanshar.github.io/Documents/)

No installation required.

### Run Locally

```bash
git clone https://github.com/BhuwanShar/Documents.git
cd Documents
```

Open `index.html` in any modern browser.

If you encounter issues with local file access (some browsers restrict this), serve it with a local server:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Then visit `http://localhost:8080`

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | Full |
| Edge 90+ | Full |
| Firefox 90+ | Full |
| Brave | Full |
| Opera | Full |
| Safari 15+ | Full |
| Mobile Chrome | Full |
| Mobile Safari | Full |

Requires: `File API`, `Canvas API`, `Blob API`, `WebAssembly`, `Fetch API`

---

## Known Limitations

| Limitation | Detail |
|---|---|
| PDF compression text | Compressed PDFs have rasterized text — not selectable or searchable |
| Encrypted PDFs | Password-protected PDFs cannot be opened |
| Large files | PDFs over 100 pages may be slow due to browser memory limits |
| OCR accuracy | Accuracy depends on scan quality; handwriting is not supported |
| PDF encryption | True AES encryption requires a backend — not possible client-side |
| Sentiment language | Sentiment analysis supports English only |
| TF-IDF minimum | Requires at least 2 documents or paragraphs to compute IDF |
| Readability accuracy | Syllable counting is approximate; scores may vary slightly from desktop tools |

---

## Roadmap

- [ ] Word cloud visualization
- [ ] Named entity recognition (Compromise.js)
- [ ] Language detection (franc.js)
- [ ] Text comparison / diff view
- [ ] DOCX to PDF (mammoth.js)
- [ ] Batch processing
- [ ] PWA — installable offline
- [ ] Instagram and Facebook contact links
- [ ] Drag-to-reorder pages in Merge tool
- [ ] Export analysis reports as PDF

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "Add: my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

**Guidelines:**
- Keep each tool in its own file under `js/tools/`
- Use `var` — no ES6 modules (global scope compatibility)
- No backend calls — everything must run client-side
- Charts must use the Canvas API — no external charting libraries
- Test in Chrome, Firefox, and Safari before submitting

---

## License

MIT License. See the `LICENSE` file for details.

---

## Developer

**Bhuwan Sharma**

- [LinkedIn](https://www.linkedin.com/in/bhuwansharma2002)
- [Portfolio](https://bhuwanshar.github.io/Portfolio/)
- [GitHub](https://github.com/BhuwanShar)

---
