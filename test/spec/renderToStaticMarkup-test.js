import React from 'react';
import renderToStaticMarkup from '../../src/util/renderToStaticMarkup';

const isReact19 = parseInt(React.version, 10) >= 19;

describe('renderToStaticMarkup', () => {
  it('renders an image without a preload link', () => {
    expect(renderToStaticMarkup(<img src="https://x.test/a.png" />)).toBe(
      '<img src="https://x.test/a.png"/>'
    );
  });

  it('renders a srcSet image without a preload link', () => {
    expect(
      renderToStaticMarkup(
        <img src="https://x.test/a.png" srcSet="https://x.test/a2.png 2x" />
      )
    ).toBe(
      '<img src="https://x.test/a.png" srcSet="https://x.test/a2.png 2x"/>'
    );
  });

  it('renders several images without preload links', () => {
    expect(
      renderToStaticMarkup(
        <div>
          <img src="https://x.test/1.png" />
          <img src="https://x.test/2.png" />
        </div>
      )
    ).toBe(
      '<div><img src="https://x.test/1.png"/><img src="https://x.test/2.png"/></div>'
    );
  });

  it('keeps links that are not image preloads', () => {
    expect(
      renderToStaticMarkup(
        <div>
          <link rel="icon" href="https://x.test/i.ico" />
        </div>
      )
    ).toContain('<link rel="icon" href="https://x.test/i.ico"/>');
  });

  it('keeps an explicit image preload link only before React 19', () => {
    const result = renderToStaticMarkup(
      <div>
        <link rel="preload" as="image" href="https://x.test/p.png" />
      </div>
    );

    expect(result).toBe(
      isReact19
        ? '<div></div>'
        : '<div><link rel="preload" as="image" href="https://x.test/p.png"/></div>'
    );
  });

  it('leaves React 19 blocking javascript: URLs in place', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const result = renderToStaticMarkup(<a href="javascript:alert(1)">x</a>);
    consoleError.mockRestore();

    expect(result).toBe(
      isReact19
        ? '<a href="javascript:throw new Error(&#x27;React has blocked a javascript: URL as a security precaution.&#x27;)">x</a>'
        : '<a href="javascript:alert(1)">x</a>'
    );
  });
});
