import blockTypeObjectFunction from '../../src/util/blockTypeObjectFunction';

const blockObject = {
  'test': 'success'
};

const blockFunction = ({type}) => {
  if (type === 'test') {
    return 'function';
  }
};

describe('blockTypeObjectFunction', () => {
  it('converts an object to a function using block type', () => {
    const newFunction = blockTypeObjectFunction(blockObject);
    const result = newFunction({type: 'test'});
    expect(result).toBe('success');
  });

  it('leaves a function as is', () => {
    const newFunction = blockTypeObjectFunction(blockFunction);
    const result = newFunction({type: 'test'});
    expect(result).toBe('function');
  });
});
