import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createDefaultState } from '../data/defaults';
import { InboxModal } from './InboxModal';

describe('InboxModal', () => {
  it('opens with the capture type selected by the mobile quick action', () => {
    const state = createDefaultState();
    const html = renderToStaticMarkup(
      <InboxModal
        items={[]}
        workspaces={state.workspaces}
        activeWorkspaceId={state.activeWorkspaceId}
        initialKind="task"
        onAdd={() => true}
        onClose={() => undefined}
        onDelete={() => undefined}
        onOrganize={() => undefined}
      />,
    );
    expect(html).toContain('<option value="task" selected="">');
    expect(html).toContain('记录一个任务');
  });
});
