import updateMutation from './util/updateMutation';
import rangeSort from './util/rangeSort';

const ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;'
};

export default(block) => {
  const blockText = block.text;

  let entities = block.entityRanges.sort(rangeSort);
  let styles = block.inlineStyleRanges.sort(rangeSort);
  let resultText = '';

  for (let index = 0; index < blockText.length; index++) {
    const char = blockText[index];

    if (ENTITY_MAP[char] !== undefined) {
      const encoded = ENTITY_MAP[char];
      resultText += encoded;

      const updateForChar = (mutation) => {
        return updateMutation(mutation, index, char.length, encoded.length);
      };

      entities = entities.map(updateForChar);
      styles = styles.map(updateForChar);
    } else {
      resultText += char;
    }
  }

  return Object.assign({}, block, {
    text: resultText,
    inlineStyleRanges: styles,
    entityRanges: entities
  });
}
