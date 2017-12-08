// @flow

declare module 'invariant' {
  declare module.exports: (condition: any, format?: string, ...args: Array<any>) => void;
}
