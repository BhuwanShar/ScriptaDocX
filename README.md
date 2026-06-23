<div align="center">

<img src="assets/favicon.svg" width="64" height="64" alt="FreeDocs Logo">

# FreeDocs

**Free, open-source document toolkit that runs entirely in your browser.**

No servers. No uploads. No sign-ups. Your files never leave your device.

[![License: MIT](https://img.shields.io/badge/License-MIT-6c63ff.svg)](https://opensource.org/licenses/MIT)
![Version](https://img.shields.io/badge/Version-1.0.0-22c55e.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5\&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3\&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript\&logoColor=black)

[**Live Demo →**](https://bhuwanshar.github.io/Documents/)
 · 
[Report Bug](https://github.com/BhuwanShar/Document/issues/new?template=bug_report.md)
 · 
[Request Feature](https://github.com/BhuwanShar/Documents.git/issues/new?template=feature_request.md)

</div>

---

## Overview

FreeDocs is a fully client-side document toolkit that provides PDF and image utilities directly in the browser.

Every operation runs locally using modern browser APIs and WebAssembly technologies. No files are uploaded, stored, or processed on external servers.

Built with plain HTML, CSS, and vanilla JavaScript—no frameworks, no build tools, and no installation required.

---

## Features

### PDF Tools

| Tool                   | Description                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| **Compress PDF**       | Reduce file size by re-rendering pages as optimized JPEG images with configurable quality and resolution |
| **OCR – Extract Text** | Extract text from scanned PDFs and images using Tesseract.js with multilingual support                   |
| **Merge PDFs**         | Combine multiple PDF files into a single document                                                        |
| **Split PDF**          | Extract specific pages using flexible page ranges such as `1-3,5,7-10`                                   |
| **Rotate Pages**       | Rotate all or selected pages by 90°, 180°, or 270°                                                       |
| **Add Watermark**      | Apply customizable text watermarks with configurable opacity, rotation, size, and color                  |
| **Add Page Numbers**   | Add page numbering with customizable position and starting value                                         |
| **Edit Metadata**      | View and modify PDF title, author, subject, and keywords                                                 |

### Image Tools

| Tool               | Description                                            |
| ------------------ | ------------------------------------------------------ |
| **PDF to Images**  | Convert PDF pages into downloadable PNG or JPEG images |
| **Images to PDF**  | Combine multiple images into a single PDF document     |
| **Compress Image** | Reduce image size while preserving visual quality      |

---

## Privacy First

> **Your files never leave your device.**

All processing occurs locally within your browser.

FreeDocs uses:

* **PDF.js** for rendering PDF documents
* **pdf-lib** for PDF creation and modification
* **Tesseract.js** for OCR through WebAssembly

There are:

* No servers
* No analytics
* No tracking
* No accounts
* No file uploads

---

## Tech Stack

| Technology         | Purpose                       |
| ------------------ | ----------------------------- |
| PDF.js             | PDF rendering                 |
| pdf-lib            | PDF generation and editing    |
| Tesseract.js       | OCR and text extraction       |
| HTML5              | User interface                |
| CSS3               | Styling and responsive layout |
| Vanilla JavaScript | Application logic             |

---

## Browser Support

FreeDocs works in all modern browsers, including:

* Google Chrome
* Microsoft Edge
* Mozilla Firefox
* Brave
* Opera

For the best experience, use the latest browser version.

---

## Getting Started

### Option 1 — Use Online

Visit:

https://bhuwanshar.github.io/Documents/

No installation is required.

### Option 2 — Run Locally

Clone the repository:

```bash
git clone https://github.com/BhuwanShar/Documents.git
cd FreeDocs
```

Open `index.html` in your preferred browser.



## Contributing

Contributions are welcome.

If you would like to improve FreeDocs, please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

For major changes, please open an issue first to discuss the proposed improvements.

---

## Roadmap

* Additional PDF editing capabilities
* Batch document processing
* Expanded OCR language support
* Improved compression algorithms
* Additional export formats

---

## License

Distributed under the MIT License.

See the `LICENSE` file for more information.

---
## Developer

**Bhuwan Sharma**

---
## Contact

* [LinkedIn](https://www.linkedin.com/in/bhuwansharma2002 )
* [Portfolio](https://bhuwanshar.github.io/Portfolio/)
<div align="center">

Made with HTML, CSS, JavaScript, and WebAssembly.

</div>
