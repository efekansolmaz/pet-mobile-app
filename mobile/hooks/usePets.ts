import { useQuery } from '@tanstack/react-query';

import { endpoints } from '@/services/api';
import { usePetStore } from '@/stores/pets';
import type { Pet } from '@/types/models';

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: () => endpoints.pets() as Promise<Pet[]>,
  });
}

export function useSelectedPet() {
  const pets = usePets();
  const selectedPetId = usePetStore((state) => state.selectedPetId);
  const setSelectedPetId = usePetStore((state) => state.setSelectedPetId);
  const pet = pets.data?.find((item) => item.id === selectedPetId) ?? pets.data?.[0] ?? null;
  if (pet && pet.id !== selectedPetId) {
    setSelectedPetId(pet.id);
  }
  return { ...pets, pet };
}
