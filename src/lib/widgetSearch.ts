import type { DeskRailWidgetId, DeskWorkspace } from '../types';
import { searchMatches } from './deskSearch';

export interface WidgetSearchItem {
  id: DeskRailWidgetId;
  label: string;
  description: string;
  keywords: string;
}

const catalog: WidgetSearchItem[] = [
  { id: 'converter', label: '单位换算', description: '长度、质量、温度等八类本机换算', keywords: '换算 单位 转换 长度 质量 重量 温度 面积 体积 速度 数据 时间 converter convert units' },
  { id: 'calendar', label: '月历', description: '查看日期、任务与日程', keywords: '日历 calendar 日期 月份' },
  { id: 'notes', label: '工作便签', description: '记录想法，自动保存', keywords: '便签 笔记 备忘录 notes sticky note' },
  { id: 'focus', label: '专注计时', description: '选择时长，开始专注', keywords: '番茄钟 计时器 休息循环 休息 循环 pomodoro focus timer' },
  { id: 'calculator', label: '快速计算', description: '直接计算常用算式', keywords: '计算器 算数 算术 calculator' },
  { id: 'weather', label: '天气', description: '查看所选城市的天气', keywords: '气温 温度 天气预报 weather' },
  { id: 'tasks', label: '今日任务', description: '添加与完成待办事项', keywords: '任务 待办 清单 todo tasks' },
  { id: 'schedule', label: '今日日程', description: '查看与添加日程', keywords: '日程 安排 schedule agenda' },
  { id: 'reminders', label: '下一提醒', description: '查看接下来的提醒', keywords: '提醒 喝水 休息 reminder' },
  { id: 'dailyOverview', label: '今日概览', description: '集中查看今天的任务和安排', keywords: '今天 概览 overview today' },
  { id: 'countdown', label: '倒数日', description: '查看重要日期与纪念日', keywords: '倒计时 时间事件 纪念日 countdown' },
  { id: 'worldClock', label: '世界时钟', description: '查看不同时区的时间', keywords: '时钟 时区 世界时间 world clock timezone' },
  { id: 'clipboard', label: '剪贴板', description: '暂存本机文本', keywords: '剪贴板 剪切板 暂存 clipboard' },
  { id: 'quickActions', label: '快捷操作', description: '新建任务、日程和开始专注', keywords: '快捷操作 快速操作 actions' },
];

/** Include hidden widgets and empty notes: search opens a temporary view. */
export function workspaceWidgetSearchItems(workspace: Pick<DeskWorkspace, 'noteTitle' | 'noteCards'>): WidgetSearchItem[] {
  return [
    ...catalog.map((item) => item.id === 'notes' ? { ...item, label: workspace.noteTitle || item.label, keywords: `${item.keywords} 工作便签` } : item),
    ...(workspace.noteCards || []).map((note) => ({ id: note.id, label: note.title, description: '打开这张便签', keywords: '便签 笔记 备忘录 notes sticky note' })),
  ];
}

export function matchingWidgets(query: string, widgets: WidgetSearchItem[], limit = 4): WidgetSearchItem[] {
  const value = query.normalize('NFKC').trim().toLocaleLowerCase('zh-CN');
  if (!value) return [];
  const rank = (item: WidgetSearchItem) => item.label.toLocaleLowerCase('zh-CN') === value ? 0 : item.keywords.toLocaleLowerCase('zh-CN').split(/\s+/).includes(value) ? 1 : 2;
  return widgets.filter((item) => searchMatches(value, item.label, item.keywords))
    .sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}
