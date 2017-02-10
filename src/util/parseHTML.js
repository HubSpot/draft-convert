const fallback = html => {
  const doc = document.implementation.createHTMLDocument('');
  doc.documentElement.innerHTML = html;
  return doc;
};

export default function parseHTML(html) {
  let doc;
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
