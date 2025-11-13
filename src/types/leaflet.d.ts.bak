// Leaflet.js型定義補助
// 動的インポート時のTypeScriptエラー解決用
declare module 'leaflet' {
  const L: any;
  export = L;
}

// Next.jsのSSR環境でのLeafletサポート
declare global {
  interface Window {
    L?: any;
  }
}

export {};