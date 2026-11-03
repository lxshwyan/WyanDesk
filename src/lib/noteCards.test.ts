import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../data/defaults';
import { copyNoteCard, normalizeNoteCards, removeNoteCard, updateNoteCard } from './noteCards';
import { migrateDeskState, parseDeskBackup, serializeDeskBackup } from './storage';
import { createBlankWorkspace } from './workspaces';

describe('independent note cards', () => {
  it('copies content and color then edits, renames and removes independently', () => {
    const original = createDefaultState().workspaces[0]; original.note = 'original';
    const copied = copyNoteCard(original, 'notes', 'note:second');
    expect(copied.layout.widgetOrder.indexOf('note:second')).toBe(copied.layout.widgetOrder.indexOf('notes') + 1);
    expect(copied.layout.widgets['note:second'].background).toEqual(original.layout.widgets.notes.background);
    const edited = updateNoteCard(copied, 'note:second', { title: '项目记录', content: 'different' });
    expect(edited.note).toBe('original'); expect(edited.noteCards?.[0]).toMatchObject({ title: '项目记录', content: 'different' });
    const removed = removeNoteCard(edited, 'note:second');
    expect(removed.note).toBe('original'); expect(removed.noteCards).toEqual([]);
    expect(removed.layout.widgets['note:second']).toBeUndefined();
  });

  it('round trips distinct note content, visibility, order and colors through backup', () => {
    const state = createDefaultState();
    state.workspaces[0] = updateNoteCard(copyNoteCard(state.workspaces[0], 'notes', 'note:second'), 'note:second', { content: 'saved', hidden: true });
    expect(parseDeskBackup(serializeDeskBackup(state)).workspaces[0]).toEqual(migrateDeskState(state).workspaces[0]);
    expect(migrateDeskState(state).workspaces[0].noteCards?.[0]).toMatchObject({ content: 'saved', hidden: true });
    expect(migrateDeskState(state).workspaces[0].layout.widgets['note:second'].background).toEqual({ gradient: 'apricot' });
  });

  it('bounds imported notes and discards duplicate or invalid ids', () => {
    expect(normalizeNoteCards([{ id: 'bad' }, { id: 'note:one', title: 'One', content: 'A' }, { id: 'note:one', content: 'B' }])).toEqual([{ id: 'note:one', title: 'One', content: 'A' }]);
    expect(normalizeNoteCards(Array.from({ length: 15 }, (_, i) => ({ id: `note:${i}` })))).toHaveLength(11);
  });

  it('inherits appearance for an empty desktop without copying any personal content', () => {
    const source = createDefaultState().workspaces[0]; source.note = 'private';
    const blank = createBlankWorkspace('blank', '新项目', copyNoteCard(source, 'notes', 'note:second'));
    expect(blank.shortcutStyle).toBe('icons'); expect(blank.shortcuts).toEqual([]); expect(blank.note).toBe('');
    expect(blank.noteCards).toBeUndefined(); expect(blank.layout.widgetOrder).not.toContain('note:second');
    expect(blank.layout.widgets.focus.background).toEqual(source.layout.widgets.focus.background);
    expect(blank.categoryBackgrounds?.['日用']).toEqual(source.categoryBackgrounds?.['AI']);
  });
});
