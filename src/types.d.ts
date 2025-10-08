declare global {
  // interface ReadonlyArray<T> {
  interface Array<T> {
    includes(searchElement: T | {} & unknown, fromIndex?: number): searchElement is T;
  }

  interface ObjectConstructor {
    keys<T>(o: T): Array<keyof T>
  }
}

export {};
