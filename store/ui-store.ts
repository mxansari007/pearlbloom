import { create } from "zustand";

type UIState = {
  isNavigating: boolean;
  start: () => void;
  stop: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isNavigating: false,
  start: () => set({ isNavigating: true }),
  stop: () => set({ isNavigating: false }),
}));