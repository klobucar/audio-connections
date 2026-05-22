// storage.ts reads the bare `localStorage` global. Node 22+ ships an
// experimental built-in `localStorage` that is undefined unless the process
// gets --localstorage-file, so install a small spec-shaped in-memory store
// over it. Each test *file* runs in its own process, so this is fresh per
// file; storage.test.ts still clears it between individual tests.
class MemoryStorage {
  #map = new Map<string, string>();
  get length(): number {
    return this.#map.size;
  }
  clear(): void {
    this.#map.clear();
  }
  getItem(key: string): string | null {
    return this.#map.has(key) ? this.#map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.#map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.#map.delete(key);
  }
  key(index: number): string | null {
    return [...this.#map.keys()][index] ?? null;
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});
