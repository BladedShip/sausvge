import type { SVGAppAPI } from './index.js';

// Access the global SVGApp object injected at runtime
export const SVGApp = (typeof window !== 'undefined' ? (window as any).SVGApp : {}) as SVGAppAPI;
