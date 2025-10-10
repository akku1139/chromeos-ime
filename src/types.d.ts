import { ContextManager } from './background/contextManager.js';

declare global {
  // interface ReadonlyArray<T> {
  interface Array<T> {
    includes(searchElement: T | {} & unknown, fromIndex?: number): searchElement is T;
  }

  interface ObjectConstructor {
    keys<T>(o: T): Array<keyof T>;
  }

  type MapValueType<M extends Map<any, any>> = M extends Map<any, infer V> ? V : never;

  type Dict = Map<string, {
    target: Array<string>,
  }>

  type DictTreeNode = Map<string, {
    children: DictTreeNode,
    end: boolean,
  }>;

  type InputMode = {
    keydown?: (key: chrome.input.ime.KeyboardEvent, ctx: ContextManager) => boolean,
    keyup?: (key: chrome.input.ime.KeyboardEvent, ctx: ContextManager) => boolean,
  };
}

export {};
