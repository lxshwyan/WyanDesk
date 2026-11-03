import { describe, expect, it } from 'vitest';
import { websiteIconSource } from './websiteIcons';

describe('local website icon boundary', () => {
  const baidu = { title: '百度', url: 'https://www.baidu.com', icon: '百' };
  it('uses a bundled asset for a known hostname and never guesses a remote favicon', () => {
    expect(websiteIconSource(baidu)).toMatch(/^\.\/site-icons\//);
    expect(websiteIconSource({ ...baidu, url: 'https://www.baidu.com.evil.example/' })).toBeNull();
    expect(websiteIconSource({ ...baidu, url: 'https://unknown.example/' })).toBeNull();
    expect(websiteIconSource({ ...baidu, url: 'not a URL' })).toBeNull();
  });
  it('preserves custom legacy text and an explicit text preference', () => {
    expect(websiteIconSource({ ...baidu, icon: '我' })).toBeNull();
    expect(websiteIconSource({ ...baidu, iconStyle: 'text' })).toBeNull();
    expect(websiteIconSource({ ...baidu, icon: '我', iconStyle: 'auto' })).toMatch(/^\.\/site-icons\//);
  });
});
