// @flow

const fallback = (html: string): Document => {
  const doc = document.implementation.createHTMLDocument('');
  if (doc.documentElement) {
    doc.documentElement.innerHTML = html;
  }

  return doc;
};

export default function parseHTML(html: string): HTMLElement | null {
  let doc: Document;
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    doc = parser.parseFromString(html, 'text/html');
    if (doc === null || doc.body === null) {
      doc = fallback(html);
    }
  } else {
    doc = fallback(html);
  }

  return doc.body;
}
