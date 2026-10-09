import type { DeskState, DeskWorkspace, Shortcut } from '../types';
import { createDefaultWorkspaceLayout } from '../lib/widgetLayout';

export const categoryOrder = ['常用', '微言服务', 'AI', '办公', '沟通', '云盘', '开发', '设计', '学习', '生活'];

export const defaultShortcuts: Shortcut[] = [
  { id: 'baidu', title: '百度', url: 'https://www.baidu.com', category: '常用', icon: '百', accent: '#3478f6', description: '信息搜索' },
  { id: 'bing', title: '必应', url: 'https://cn.bing.com', category: '常用', icon: 'B', accent: '#087f5b', description: '网页与图片搜索' },
  { id: 'mail-163', title: '163 邮箱', url: 'https://mail.163.com', category: '常用', icon: '邮', accent: '#d9343a', description: '邮件' },
  { id: 'bilibili', title: '哔哩哔哩', url: 'https://www.bilibili.com', category: '常用', icon: '哔', accent: '#ef6c9a', description: '视频与学习' },
  { id: 'zhihu', title: '知乎', url: 'https://www.zhihu.com', category: '常用', icon: '知', accent: '#1769e0', description: '问答与专栏' },
  { id: 'railway', title: '12306', url: 'https://www.12306.cn', category: '常用', icon: '铁', accent: '#1982a5', description: '铁路出行' },

  { id: 'wyanhub', title: 'WyanHub', url: 'https://wyanhub.com', category: '微言服务', icon: 'W', accent: '#2563eb', description: '微言应用中心', featured: true },
  { id: 'wyan-tools', title: '微言工具箱', url: 'https://tools.wyanhub.com/tools', category: '微言服务', icon: '具', accent: '#149668', description: '图片、PDF、表格与文本工具', featured: true },
  { id: 'wyan-forms', title: '微言表单', url: 'https://forms.wyanhub.com', category: '微言服务', icon: '表', accent: '#3478f6', description: '设计、发布与收集表单', featured: true },
  { id: 'wyan-events', title: '微言活动', url: 'https://events.wyanhub.com', category: '微言服务', icon: '活', accent: '#d97706', description: '报名、票券与签到' },
  { id: 'wyan-collect', title: '微言收集箱', url: 'https://collect.wyanhub.com', category: '微言服务', icon: '收', accent: '#7c3aed', description: '材料收集与整理' },
  { id: 'wyan-booking', title: '微言预约', url: 'https://booking.wyanhub.com', category: '微言服务', icon: '约', accent: '#0891b2', description: '时段、场地与设备预约' },
  { id: 'wyan-workflow', title: '微言流程', url: 'https://workflow.wyanhub.com', category: '微言服务', icon: '流', accent: '#db2777', description: '申请、审批与待办' },

  { id: 'chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com', category: 'AI', icon: 'C', accent: '#10a37f', description: 'AI 助手' },
  { id: 'deepseek', title: 'DeepSeek', url: 'https://chat.deepseek.com', category: 'AI', icon: 'D', accent: '#4d6bfe', description: 'AI 助手' },
  { id: 'kimi', title: 'Kimi', url: 'https://www.kimi.com', category: 'AI', icon: 'K', accent: '#111827', description: '长文本与资料助手' },
  { id: 'doubao', title: '豆包', url: 'https://www.doubao.com/chat/', category: 'AI', icon: '豆', accent: '#705cff', description: 'AI 助手' },

  { id: 'tencent-docs', title: '腾讯文档', url: 'https://docs.qq.com', category: '办公', icon: '文', accent: '#2b7fff', description: '在线文档' },
  { id: 'feishu', title: '飞书', url: 'https://www.feishu.cn', category: '办公', icon: '飞', accent: '#3370ff', description: '协作与沟通' },
  { id: 'dingtalk', title: '钉钉', url: 'https://www.dingtalk.com', category: '办公', icon: '钉', accent: '#168cff', description: '企业协作' },
  { id: 'shimo', title: '石墨文档', url: 'https://shimo.im', category: '办公', icon: '石', accent: '#263238', description: '在线文档协作' },
  { id: 'wps', title: 'WPS', url: 'https://www.wps.cn', category: '办公', icon: 'W', accent: '#e4483c', description: '办公套件' },
  { id: 'qq-mail', title: 'QQ 邮箱', url: 'https://mail.qq.com', category: '办公', icon: 'Q', accent: '#1d9bf0', description: '邮件' },

  { id: 'wecom', title: '企业微信', url: 'https://work.weixin.qq.com', category: '沟通', icon: '企', accent: '#2f7cf6', description: '企业沟通' },
  { id: 'tencent-meeting', title: '腾讯会议', url: 'https://meeting.tencent.com', category: '沟通', icon: '会', accent: '#2d8cf0', description: '视频会议' },
  { id: 'zoom', title: 'Zoom', url: 'https://zoom.us', category: '沟通', icon: 'Z', accent: '#2d8cff', description: '视频会议' },

  { id: 'aliyun-drive', title: '阿里云盘', url: 'https://www.alipan.com', category: '云盘', icon: '阿', accent: '#446dff', description: '文件与云端存储' },
  { id: 'baidu-pan', title: '百度网盘', url: 'https://pan.baidu.com', category: '云盘', icon: '盘', accent: '#356df6', description: '文件与云端存储' },
  { id: 'quark-drive', title: '夸克网盘', url: 'https://pan.quark.cn', category: '云盘', icon: '夸', accent: '#5a55ee', description: '文件与云端存储' },

  { id: 'github', title: 'GitHub', url: 'https://github.com', category: '开发', icon: 'GH', accent: '#24292f', description: '代码托管' },
  { id: 'gitee', title: 'Gitee', url: 'https://gitee.com', category: '开发', icon: 'G', accent: '#c71d23', description: '代码托管' },
  { id: 'mdn', title: 'MDN', url: 'https://developer.mozilla.org/zh-CN/', category: '开发', icon: 'M', accent: '#4f46e5', description: 'Web 开发文档' },
  { id: 'npm', title: 'npm', url: 'https://www.npmjs.com', category: '开发', icon: 'N', accent: '#cb3837', description: 'JavaScript 包' },
  { id: 'stackoverflow', title: 'Stack Overflow', url: 'https://stackoverflow.com', category: '开发', icon: 'SO', accent: '#f48024', description: '技术问答' },
  { id: 'docker', title: 'Docker Hub', url: 'https://hub.docker.com', category: '开发', icon: 'D', accent: '#2496ed', description: '容器镜像' },

  { id: 'figma', title: 'Figma', url: 'https://www.figma.com', category: '设计', icon: 'F', accent: '#7c3aed', description: '界面与原型' },
  { id: 'canva', title: 'Canva', url: 'https://www.canva.cn', category: '设计', icon: 'C', accent: '#00a7b5', description: '平面设计' },
  { id: 'iconfont', title: 'Iconfont', url: 'https://www.iconfont.cn', category: '设计', icon: 'i', accent: '#4f46e5', description: '图标库' },
  { id: 'unsplash', title: 'Unsplash', url: 'https://unsplash.com', category: '设计', icon: 'U', accent: '#111827', description: '免费图片' },
  { id: 'dribbble', title: 'Dribbble', url: 'https://dribbble.com', category: '设计', icon: 'D', accent: '#ea4c89', description: '设计灵感' },
  { id: 'coolors', title: 'Coolors', url: 'https://coolors.co', category: '设计', icon: 'C', accent: '#4c6fff', description: '配色工具' },

  { id: 'mooc', title: '中国大学 MOOC', url: 'https://www.icourse163.org', category: '学习', icon: 'M', accent: '#c2413b', description: '在线课程' },
  { id: 'wikipedia', title: '维基百科', url: 'https://zh.wikipedia.org', category: '学习', icon: 'W', accent: '#374151', description: '自由百科' },
  { id: 'scholar', title: 'Google Scholar', url: 'https://scholar.google.com', category: '学习', icon: 'G', accent: '#4285f4', description: '学术搜索' },
  { id: 'weread', title: '微信读书', url: 'https://weread.qq.com', category: '学习', icon: '读', accent: '#22a06b', description: '在线阅读' },

  { id: 'taobao', title: '淘宝', url: 'https://www.taobao.com', category: '生活', icon: '淘', accent: '#ff5a1f', description: '购物' },
  { id: 'jd', title: '京东', url: 'https://www.jd.com', category: '生活', icon: '京', accent: '#e2231a', description: '购物' },
  { id: 'amap', title: '高德地图', url: 'https://www.amap.com', category: '生活', icon: '高', accent: '#3579f6', description: '地图与出行' },
  { id: 'douban', title: '豆瓣', url: 'https://www.douban.com', category: '生活', icon: '豆', accent: '#0b8f48', description: '书影音' },
  { id: 'xiaohongshu', title: '小红书', url: 'https://www.xiaohongshu.com', category: '生活', icon: '小', accent: '#ff2442', description: '生活灵感' },
  { id: 'ctrip', title: '携程', url: 'https://www.ctrip.com', category: '生活', icon: '程', accent: '#287dfa', description: '旅行与出行' },
];

function createDefaultWorkspace(
  id: string,
  name: string,
  categories: string[],
  shortcutFilter: (shortcut: Shortcut) => boolean,
  withWelcomeTask = false,
): DeskWorkspace {
  return {
    id,
    name,
    categories: [...categories],
    shortcuts: defaultShortcuts.filter(shortcutFilter).map((item) => ({ ...item })),
    shortcutGroups: [],
    tasks: withWelcomeTask
      ? [{ id: 'welcome-task', text: '整理今天最重要的一件事', done: false, createdAt: new Date().toISOString() }]
      : [],
    focusTaskId: '',
    note: '',
    events: [],
    recentShortcutIds: [],
    layout: createDefaultWorkspaceLayout(),
  };
}

export function createDefaultState(): DeskState {
  const workspaces = [
    createDefaultWorkspace('workspace-work', '工作', categoryOrder, () => true, true),
    createDefaultWorkspace('workspace-study', '学习', ['AI', '学习'], (shortcut) => ['AI', '学习'].includes(shortcut.category)),
    createDefaultWorkspace('workspace-life', '生活', ['常用', '生活'], (shortcut) => ['常用', '生活'].includes(shortcut.category)),
  ];
  return {
    version: 8,
    activeWorkspaceId: workspaces[0].id,
    workspaces,
    inbox: [],
    timeEvents: [],
    reminders: [
      { id: 'start-work', title: '准备开始工作', time: '08:50', enabled: true, kind: 'work' },
      { id: 'water-morning', title: '喝水时间到了', time: '10:00', enabled: true, kind: 'water' },
      { id: 'lunch', title: '午餐时间到了', time: '12:00', enabled: true, kind: 'meal' },
      { id: 'water-afternoon', title: '起身喝水', time: '15:00', enabled: true, kind: 'water' },
      { id: 'finish-work', title: '今天辛苦了，该下班了', time: '18:00', enabled: true, kind: 'rest' },
    ],
    preferences: {
      scene: 'dawn',
      sceneMotion: true,
      autoLockMinutes: 0,
      lockActivityEnabled: true,
      lockMessage: '',
      compactShortcuts: false,
      showTasks: true,
      showNotes: true,
      showReminders: true,
      showQuickActions: true,
      showFocusTimer: true,
      focusDurationMinutes: 25,
      showSchedule: true,
      showCalendar: false,
      showCalculator: false,
      showWorldClock: false,
      worldClockZones: ['Europe/London', 'America/New_York', 'Asia/Tokyo'],
      showDailyOverview: false,
      showTimeEvents: true,
      showRecent: true,
      systemNotifications: false,
      searchEngine: 'baidu',
      customBackground: '',
      onboardingCompleted: false,
      productDiscoveryDismissed: false,
    },
  };
}
