import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// findBy* attend 1 s par défaut : trop court pour un parcours (session restaurée, page chargée à la
// demande, appel API) quand toute la suite tourne en parallèle.
configure({ asyncUtilTimeout: 5_000 });

// jsdom n'implémente pas ResizeObserver, utilisé par certains composants Radix (Switch…).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
