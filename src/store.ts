import { create } from 'zustand';
import { AIStudioSocket, aistudio } from './aistudio';

interface WorldState {
  objects: any[];
  gravity: number;
  setGravity: (g: number) => void;
  addObject: (obj: any) => void;
  updateObject: (id: string, data: any) => void;
  removeObject: (id: string) => void;
  clearObjects: () => void;
  socket: AIStudioSocket | null;
  initSocket: () => void;
  user: any;
  setUser: (u: any) => void;
}

export const useStore = create<WorldState>((set, get) => ({
  objects: [],
  gravity: -9.81,
  socket: null,
  user: null,
  setGravity: (g) => set({ gravity: g }),
  setUser: (u) => set({ user: u }),
  initSocket: async () => {
    const socket = new AIStudioSocket();
    const user = await aistudio.getUser();
    set({ socket, user });
    
    // Periodically update presence
    setInterval(() => {
        socket.updatePresence({ user: user.id, action: 'idle' });
    }, 1000);
  },
  addObject: (obj) => set((state) => ({ objects: [...state.objects, obj] })),
  updateObject: (id, data) => set((state) => ({
    objects: state.objects.map((o) => (o.id === id ? { ...o, ...data } : o))
  })),
  removeObject: (id) => set((state) => ({
    objects: state.objects.filter((o) => o.id !== id)
  })),
  clearObjects: () => set({ objects: [] })
}));
