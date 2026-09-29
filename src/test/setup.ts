import "@testing-library/jest-dom/vitest";

// jsdom n'implémente pas ResizeObserver, utilisé par certains composants Radix (Switch…).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
