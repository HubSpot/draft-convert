import updateMutation from './util/updateMutation';
import rangeSort from './util/rangeSort';

const converter = (entity = {}, originalText) => {
  switch (entity.type) {
    case 'mergeTag':
      return `{{ ${entity.data.prefix}.${entity.data.property} }}`;
    case 'LINK':
      return `<a href="${entity.data.url}">${originalText}</a>`;
    default:
      return originalText;
  }
};

export default (block, entityMap, entityConverter = converter) => {
  let resultText = block.text;

  if (block.hasOwnProperty('entityRanges') && block.entityRanges.length > 0) {
    let entities = block.entityRanges.sort(rangeSort);

    let styles = block.inlineStyleRanges;

    for (let index = 0; index < entities.length; index++) {
      const entityRange = entities[index];
      const entity = entityMap[entityRange.key];

      const originalText = resultText.substr(entityRange.offset, entityRange.length);

      const converted = entityConverter(entity, originalText) || originalText;

      const updateLaterMutation = (mutation, mutationIndex) => {
        if (mutationIndex >= index || mutation.hasOwnProperty('style')) {
          return updateMutation(mutation, entityRange.offset, entityRange.length, converted.length);
        }
        return mutation;
      };

      entities = entities.map(updateLaterMutation);
      styles = styles.map(updateLaterMutation);

      resultText = resultText.substring(0, entityRange.offset) + converted + resultText.substring(entityRange.offset + entityRange.length);
    }

    return Object.assign({}, block, {
      text: resultText,
      inlineStyleRanges: styles,
      entityRanges: entities
    });
  }

  return block;
};
