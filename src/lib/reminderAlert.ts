import type { DeskReminder } from '../types';

export type ReminderAlertKind = DeskReminder['kind'] | 'task';

export interface ReminderAlertData {
  id: string;
  title: string;
  time: string;
  context: string;
  kind: ReminderAlertKind;
  notificationTitle: string;
}

export function shouldShowInPageReminder(visibilityState: DocumentVisibilityState, locked: boolean): boolean {
  return visibilityState === 'visible' && !locked;
}

export function playReminderChime(): void {
  const AudioContextConstructor = window.AudioContext
    || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;

  const context = new AudioContextConstructor();
  const play = () => {
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.025);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.72);
    master.connect(context.destination);

    [659.25, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const startAt = context.currentTime + index * 0.18;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startAt);
      noteGain.gain.setValueAtTime(0.0001, startAt);
      noteGain.gain.exponentialRampToValueAtTime(index === 0 ? 0.74 : 0.56, startAt + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.38);
      oscillator.connect(noteGain);
      noteGain.connect(master);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.4);
    });

    window.setTimeout(() => void context.close(), 900);
  };

  if (context.state === 'suspended') {
    void context.resume().then(play).catch(() => void context.close());
    return;
  }
  play();
}
