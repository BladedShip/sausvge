export interface SVGAppAPI {
  loadData: () => any;
  saveData: (data: any) => void;
  init: () => void;
  createSVGElement: (tag: string, className?: string) => Element;
  storage: {
    getItem: (key: string) => any;
    setItem: (key: string, value: any) => void;
    removeItem: (key: string) => void;
    clear: () => void;
  };
  router: {
    hash: string;
    navigate: (hash: string) => void;
    subscribe: (callback: (hash: string) => void) => () => void;
  };
}

declare global {
  interface Window {
    SVGApp: SVGAppAPI;
  }
  var SVGApp: SVGAppAPI;
}
