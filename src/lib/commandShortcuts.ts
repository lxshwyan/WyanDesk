export type QuickCommandKind = 'task' | 'google' | 'baidu' | 'bing' | 'translate';

export type QuickCommandInput = {
  [Kind in QuickCommandKind]: { kind: Kind; value: string };
}[QuickCommandKind];

const prefixes: Array<{ pattern: RegExp; kind: QuickCommandKind }> = [
  { pattern: /^(?:任务|todo)\s+(.+)$/i, kind: 'task' },
  { pattern: /^g\s+(.+)$/i, kind: 'google' },
  { pattern: /^bd\s+(.+)$/i, kind: 'baidu' },
  { pattern: /^bing\s+(.+)$/i, kind: 'bing' },
  { pattern: /^(?:fy|翻译)\s+(.+)$/i, kind: 'translate' },
];

export function parseQuickCommand(input: string): QuickCommandInput | null {
  const value = input.trim();
  for (const prefix of prefixes) {
    const match = value.match(prefix.pattern);
    const content = match?.[1]?.trim();
    if (content) return { kind: prefix.kind, value: content } as QuickCommandInput;
  }
  return null;
}

export function quickCommandURL(command: { kind: Exclude<QuickCommandKind, 'task'>; value: string }): string {
  const value = encodeURIComponent(command.value);
  if (command.kind === 'google') return `https://www.google.com/search?q=${value}`;
  if (command.kind === 'baidu') return `https://www.baidu.com/s?wd=${value}`;
  if (command.kind === 'bing') return `https://cn.bing.com/search?q=${value}`;
  return `https://translate.google.com/?sl=auto&tl=zh-CN&text=${value}&op=translate`;
}
