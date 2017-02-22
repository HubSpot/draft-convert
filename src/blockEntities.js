import updateMutation from './util/updateMutation';
import rangeSort from './util/rangeSort';
import getElementHTML from './util/getElementHTML';
import getElementPrefix from './util/getElementPrefix';

const converter = (entity = {}, originalText) => {
  return originalText;
};

export default (block, entityMap, entityConverter = converter) => {
  let resultText = block.text;

  let getEntityHTML = entityConverter;

  if (entityConverter.__isMiddleware) {
    getEntityHTML = entityConverter(converter);
  }

  if (Object.prototype.hasOwnProperty.call(block, 'entityRanges') && block.entityRanges.length > 0) {
    let entities = block.entityRanges.sort(rangeSort);

    let styles = block.inlineStyleRanges;

    for (let index = 0; index < entities.length; index++) {
      const entityRange = entities[index];
      const entity = entityMap[entityRange.key];

      const originalText = resultText.substr(entityRange.offset, entityRange.length);

      const entityHTML = getEntityHTML(entity, originalText);
      const converted = getElementHTML(entityHTML, originalText)
                        || originalText;

      const prefixLength = getElementPrefix(entityHTML);

      const updateLaterMutation = (mutation, mutationIndex) => {
        if (mutationIndex >= index || Object.prototype.hasOwnProperty.call(mutation, 'style')) {
          return updateMutation(
            mutation, entityRange.offset, entityRange.length,
            converted.length, prefixLength
          );
        }
        return mutation;
      };

      entities = entities.map(updateLaterMutation);
      styles = styles.map(updateLaterMutation);

      resultText = resultText.substring(0, entityRange.offset)
                   + converted
                   + resultText.substring(entityRange.offset + entityRange.length);
    }

    return Object.assign({}, block, {
      text: resultText,
      inlineStyleRanges: styles,
      entityRanges: entities
    });
  }

  return block;
};
