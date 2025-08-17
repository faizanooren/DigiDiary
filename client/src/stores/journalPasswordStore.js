import { create } from 'zustand';

const useJournalPasswordStore = create((set) => ({
  passwords: {},
  addPassword: (journalId, password) =>
    set((state) => ({
      passwords: { ...state.passwords, [journalId]: password },
    })),
  getPassword: (journalId) => {
    const state = useJournalPasswordStore.getState();
    return state.passwords[journalId];
  },
  removePassword: (journalId) =>
    set((state) => {
      const newPasswords = { ...state.passwords };
      delete newPasswords[journalId];
      return { passwords: newPasswords };
    }),
}));

export default useJournalPasswordStore;
