// @flow

import updateMutation from './util/updateMutation';
import rangeSort from './util/rangeSort';
import getElementHTMLWithText from './util/getElementHTMLWithText';
import getElementTagLength from './util/getElementTagLength';

import type { RawBlock } from './flow/RawBlock';
import type { RawEntity } from './flow/RawEntity';
import type { EntityMarkup } from './flow/Markup';
import type { EntityRange, InlineStyleRange, Mutation } from './flow/Mutations';

const converter = (entity: RawEntity = {}, originalText: string): EntityMarkup => {
  return originalText;
};

export default (
  block: RawBlock,
  entityMap: {[entityKey: string]: RawEntity},
  entityConverter: Function = converter
): RawBlock => {
  let resultText = [...Array.from(block.text)];

  let getEntityHTML = entityConverter;

  if (entityConverter.__isMiddleware) {
    getEntityHTML = entityConverter(converter);
  }

  getEntityHTML = ((getEntityHTML: any): (RawEntity, string) => EntityMarkup);

  if (
    Object.prototype.hasOwnProperty.call(block, 'entityRanges') &&
    block.entityRanges &&
    block.entityRanges.length > 0
  ) {
    let entities: Array<EntityRange> = block.entityRanges.sort(rangeSort);

    let styles: Array<InlineStyleRange> = block.inlineStyleRanges;

    for (let index = 0; index < entities.length; index++) {
      const entityRange: EntityRange = entities[index];
      const entity = entityMap[entityRange.key];

      const originalText = resultText.slice(entityRange.offset, entityRange.offset + entityRange.length).join('');

      const entityHTML = getEntityHTML(entity, originalText);
      const converted = getElementHTMLWithText(entityHTML, originalText)
                        || originalText;

      const prefixLength = getElementTagLength(entityHTML, 'start');
      const suffixLength = getElementTagLength(entityHTML, 'end');

      const updateLaterMutation = function<U: Mutation>(mutation: U, mutationIndex: number): U | Array<U> {
        if (mutationIndex > index || Object.prototype.hasOwnProperty.call(mutation, 'style')) {
          return updateMutation(
            mutation,
            entityRange.offset,
            entityRange.length,
            converted.length,
            prefixLength,
            suffixLength
          );
        }
        return mutation;
      };

      const updateLaterMutations = function<U: Mutation>(mutationList: Array<U>): Array<U> {
        return mutationList.reduce(
          (acc: Array<U>, mutation: U, mutationIndex: number): Array<U> => {
            const updatedMutation = updateLaterMutation(mutation, mutationIndex);
            if (Array.isArray(updatedMutation)) {
              return acc.concat(updatedMutation);
            }

            return acc.concat([updatedMutation]);
          }
        , []);
      };

      entities = updateLaterMutations(entities);
      styles = updateLaterMutations(styles);

      resultText = [
        ...resultText.slice(0, entityRange.offset),
        ...Array.from(converted),
        ...resultText.slice(entityRange.offset + entityRange.length)
      ];
    }

    return Object.assign({}, block, {
      text: resultText.join(''),
      inlineStyleRanges: styles,
      entityRanges: entities
    });
  }

  return block;
};
