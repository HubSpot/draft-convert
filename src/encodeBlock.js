// import updateMutation from './util/updateMutation';
import rangeSort from './util/rangeSort';

// const ENTITY_MAP = {
//   '&': '&amp;',
//   '<': '&lt;',
//   '>': '&gt;',
//   '"': '&quot;',
//   "'": '&#x27;',
//   '`': '&#x60;',
//   '\n': '<br/>'
// };
//
export default block => {
  const blockText = block.text;

  const entities = block.entityRanges.sort(rangeSort);
  const styles = block.inlineStyleRanges.sort(rangeSort);
//   let resultText = '';
//
//   for (let index = 0; index < blockText.length; index++) {
//     const char = blockText[index];
//
//     const encoded = ENTITY_MAP[char];
//     if (encoded) {
//       const resultIndex = resultText.length;
//       resultText += encoded;
//
//       const updateForChar = mutation => {
//         return updateMutation(mutation, resultIndex, char.length, encoded.length, 0, 0);
//       };
//
//       entities = entities.map(updateForChar);
//       styles = styles.map(updateForChar);
//     } else {
//       resultText += char;
//     }
//   }

  return Object.assign({}, block, {
    // text: resultText,
    text: blockText,
    inlineStyleRanges: styles,
    entityRanges: entities
  });
};
