export interface BatchOpenResult {
  attempted: number;
  opened: number;
  blocked: number;
}

interface ExternalWindowHandle {
  opener: unknown;
  location: {
    replace: (url: string) => void;
  };
  close?: () => void;
}

export type ExternalWindowOpener = () => ExternalWindowHandle | null;

function defaultWindowOpener(): ExternalWindowHandle | null {
  return window.open('', '_blank');
}

export function openExternalURL(url: string, opener: ExternalWindowOpener = defaultWindowOpener): boolean {
  const target = opener();
  if (!target) return false;

  try {
    // Detach the new page before navigation so it cannot control the desktop tab.
    target.opener = null;
    target.location.replace(url);
    return true;
  } catch {
    target.close?.();
    return false;
  }
}

export function openExternalURLs(urls: string[], opener: ExternalWindowOpener = defaultWindowOpener): BatchOpenResult {
  let opened = 0;
  for (const url of urls) {
    if (openExternalURL(url, opener)) opened += 1;
  }
  return {
    attempted: urls.length,
    opened,
    blocked: urls.length - opened,
  };
}
