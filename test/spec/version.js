import * as draftConvert from '../../src/index';

describe('versioning', () => {
  it('exports a string version number', () => {
    expect(draftConvert.__version).toBeDefined();
    expect(typeof draftConvert.__version).toBe('string');
  });
});
