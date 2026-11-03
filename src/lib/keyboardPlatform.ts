export function primaryModifierKey(platform = typeof navigator === 'undefined' ? '' : navigator.platform): '⌘' | 'Ctrl' {
  return /Mac|iPhone|iPad|iPod/i.test(platform) ? '⌘' : 'Ctrl';
}
