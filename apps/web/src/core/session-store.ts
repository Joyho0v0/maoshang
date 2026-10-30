import { defineStore } from 'pinia';

import type { SessionSnapshot } from './types';

export const useSessionStore = defineStore('session', {
  state: (): { snapshot: SessionSnapshot } => ({
    snapshot: { status: 'anonymous', epoch: 0 },
  }),
  actions: {
    setSnapshot(snapshot: SessionSnapshot): void {
      this.snapshot = snapshot;
    },
  },
});
