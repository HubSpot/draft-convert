export type RawEntity = {
  type: string,
  mutability: 'IMMUTABLE' | 'MUTABLE' | 'SEGMENTED',
  data: ?{[key: string]: any}
};
