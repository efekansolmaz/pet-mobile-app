import { create } from 'zustand';

type PetSelectionState = {
  selectedPetId: string | null;
  setSelectedPetId: (id: string | null) => void;
};

export const usePetStore = create<PetSelectionState>((set) => ({
  selectedPetId: null,
  setSelectedPetId: (id) => set({ selectedPetId: id }),
}));
