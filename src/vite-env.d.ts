/// <reference types="vite/client" />

interface Window {
  WyanDeskStartup?: {
    applyAppearance(preferences: { scene: import('./types').SceneId; customBackground: string; transparentAppearance?: boolean; wallpaperView?: import('./types').WallpaperView }): void;
  };
}
