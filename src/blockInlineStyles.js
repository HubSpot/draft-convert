import invariant from 'invariant';
import styleObjectFunction from './util/styleObjectFunction';
import accumulateFunction from './util/accumulateFunction';
import getElementHTML from './util/getElementHTML';
import rangeSort from './util/rangeSort';
import defaultInlineHTML from './default/defaultInlineHTML';

const subtractStyles = (original, toRemove) => {
  return original.filter(el => {
    return !toRemove.some(elToRemove => {
      return elToRemove.style === el.style;
    });
  });
};

const popEndingStyles = (styleStack, endingStyles) => {
  return endingStyles.reduceRight((stack, style) => {
    const styleToRemove = stack[stack.length - 1];

    invariant(
      styleToRemove.style === style.style,
      `Style ${styleToRemove.style} to be removed doesn't match expected ${style.style}`
    );

    return stack.slice(0, -1);
  }, styleStack);
};

const characterStyles = (offset, ranges) => {
  return ranges.filter(range => {
    return (offset >= range.offset && offset < (range.offset + range.length));
  });
};

const rangeIsSubset = (firstRange, secondRange) => {
  // returns true if the second range is a subset of the first
  const secondStartWithinFirst = firstRange.offset <= secondRange.offset;
  const secondEndWithinFirst = firstRange.offset + firstRange.length
                               >= secondRange.offset + secondRange.length;

  return secondStartWithinFirst && secondEndWithinFirst;
};

const latestStyleLast = (s1, s2) => {
  // make sure longer-lasting styles are added first
  const s2endIndex = s2.offset + s2.length;
  const s1endIndex = s1.offset + s1.length;
  return s2endIndex - s1endIndex;
};

const getStylesToReset = (remainingStyles, newStyles) => {
  let i = 0;
  while (i < remainingStyles.length) {
    if (newStyles.every(rangeIsSubset.bind(null, remainingStyles[i]))) {
      i++;
    } else {
      return remainingStyles.slice(i);
    }
  }
  return [];
};

const appendStartMarkup = (inlineHTML, string, styleRange) => {
  return string + getElementHTML(inlineHTML(styleRange.style)).start;
};

const prependEndMarkup = (inlineHTML, string, styleRange) => {
  return getElementHTML(inlineHTML(styleRange.style)).end + string;
};

const defaultCustomInlineHTML = next => style => next(style);
defaultCustomInlineHTML.__isMiddleware = true;

export default (rawBlock, customInlineHTML = defaultCustomInlineHTML) => {
  invariant(
    rawBlock !== null && rawBlock !== undefined,
    'Expected raw block to be non-null'
  );


  let inlineHTML;
  if (customInlineHTML.__isMiddleware === true) {
    inlineHTML = customInlineHTML(defaultInlineHTML);
  } else {
    inlineHTML = accumulateFunction(
      styleObjectFunction(customInlineHTML),
      styleObjectFunction(defaultInlineHTML)
    );
  }

  let result = '';
  let styleStack = [];

  const sortedRanges = rawBlock.inlineStyleRanges.sort(rangeSort);

  for (let i = 0; i < rawBlock.text.length; i++) {
    const styles = characterStyles(i, sortedRanges);

    const endingStyles = subtractStyles(styleStack, styles);
    const newStyles = subtractStyles(styles, styleStack);
    const remainingStyles = subtractStyles(styleStack, endingStyles);

    // reset styles: look for any already existing styles that will need to
    // end before styles that are being added on this character. to solve this
    // close out those current tags and all nested children,
    // then open new ones nested within the new styles.
    const resetStyles = getStylesToReset(remainingStyles, newStyles);

    const openingStyles = resetStyles.concat(newStyles).sort(latestStyleLast);

    const openingStyleTags = openingStyles.reduce(appendStartMarkup.bind(null, inlineHTML), '');
    const endingStyleTags = endingStyles.concat(resetStyles).reduce(prependEndMarkup.bind(null, inlineHTML), '');

    result += endingStyleTags + openingStyleTags + rawBlock.text[i];

    styleStack = popEndingStyles(styleStack, resetStyles.concat(endingStyles));
    styleStack = styleStack.concat(openingStyles);

    invariant(
      styleStack.length === styles.length,
      `Character ${i}: ${styleStack.length - styles.length} styles left on stack that should no longer be there`
    );
  }

  result = styleStack.reduceRight((res, openStyle) => {
    return res + getElementHTML(inlineHTML(openStyle.style)).end;
  }, result);

  return result;
};
