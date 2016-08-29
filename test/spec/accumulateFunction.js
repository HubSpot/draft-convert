import accumulateFunction from '../../src/util/accumulateFunction';

const returnsString = () => 'test';
const returnsNull = () => null;
const returnsUndefined = () => {};

describe('accumulateFunction', () => {
  it('returns value from the first function for a string value', () => {
    const result = accumulateFunction(returnsString, returnsNull)();
    expect(result).toBe(returnsString());
  });

  it('returns value from second function when first return is undefined', () => {
    const result = accumulateFunction(returnsUndefined, returnsString)();
    expect(result).toBe(returnsString());
  });

  it('returns value from second function when first return is null', () => {
    const result = accumulateFunction(returnsNull, returnsString)();
    expect(result).toBe(returnsString());
  });
});
