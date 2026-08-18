/**
 * Download Service
 * ================
 * Provides file download capabilities for any content type.
 *
 * @module services/download
 */

class DownloadService {
    /**
     * Download a text file.
     * @param {string} content   - File contents
     * @param {string} filename  - Download filename (include extension)
     * @param {string} [mimeType]
     */
    text(content, filename, mimeType = 'text/plain;charset=utf-8') {
        const blob = new Blob([content], { type: mimeType });
        this.#download(blob, filename);
    }

    /**
     * Download a JSON file.
     * @param {*}      data     - Serialisable data
     * @param {string} filename
     */
    json(data, filename = 'data.json') {
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        this.text(content, filename, 'application/json');
    }

    /**
     * Download an HTML file.
     * @param {string} html
     * @param {string} filename
     */
    html(html, filename = 'index.html') {
        this.text(html, filename, 'text/html;charset=utf-8');
    }

    /**
     * Download a CSV file.
     * @param {string} csv
     * @param {string} filename
     */
    csv(csv, filename = 'data.csv') {
        this.text(csv, filename, 'text/csv;charset=utf-8');
    }

    /**
     * Download an SVG file.
     * @param {string} svg
     * @param {string} filename
     */
    svg(svg, filename = 'image.svg') {
        this.text(svg, filename, 'image/svg+xml');
    }

    /**
     * Download a canvas element as PNG.
     * @param {HTMLCanvasElement} canvas
     * @param {string}            filename
     */
    canvas(canvas, filename = 'image.png') {
        canvas.toBlob(blob => {
            if (blob) this.#download(blob, filename);
        }, 'image/png');
    }

    /**
     * Download an image from a data URL.
     * @param {string} dataUrl
     * @param {string} filename
     */
    dataUrl(dataUrl, filename = 'image.png') {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
    }

    /**
     * Download a Blob.
     * @param {Blob}   blob
     * @param {string} filename
     */
    blob(blob, filename) {
        this.#download(blob, filename);
    }

    /** @private */
    #download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
        }, 100);
    }
}

export const downloadService = new DownloadService();
