import { describe, expect, it } from 'vitest';
import { parseQuickCommand, quickCommandURL } from './commandShortcuts';

describe('command center shortcuts', () => {
  it('parses task and search prefixes without swallowing empty input', () => {
    expect(parseQuickCommand('任务 整理项目计划')).toEqual({ kind: 'task', value: '整理项目计划' });
    expect(parseQuickCommand('G design systems')).toEqual({ kind: 'google', value: 'design systems' });
    expect(parseQuickCommand('fy hello world')).toEqual({ kind: 'translate', value: 'hello world' });
    expect(parseQuickCommand('任务   ')).toBeNull();
    expect(parseQuickCommand('普通搜索')).toBeNull();
  });

  it('builds encoded search URLs', () => {
    expect(quickCommandURL({ kind: 'baidu', value: '微言 桌面' })).toBe('https://www.baidu.com/s?wd=%E5%BE%AE%E8%A8%80%20%E6%A1%8C%E9%9D%A2');
    expect(quickCommandURL({ kind: 'bing', value: 'WyanDesk' })).toBe('https://cn.bing.com/search?q=WyanDesk');
  });
});
