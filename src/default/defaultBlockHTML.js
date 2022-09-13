import React from 'react';

// based on Draft.js' custom list depth styling
const ORDERED_LIST_TYPES = ['1', 'a', 'i'];

export default {
  unstyled: <p />,
  paragraph: <p />,
  'header-one': <h1 />,
  'header-two': <h2 />,
  'header-three': <h3 />,
  'header-four': <h4 />,
  'header-five': <h5 />,
  'header-six': <h6 />,
  'code-block': <pre />,
  blockquote: <blockquote />,
  'unordered-list-item': {
    element: <li />,
    nest: <ul />,
  },
  'ordered-list-item': {
    element: <li />,
    nest: depth => {
      const type = ORDERED_LIST_TYPES[depth % 3];
      return <ol type={type} />;
    },
  },
  media: <figure />,
  atomic: <figure />,
  article: <article />,
  section: <section />,
};
