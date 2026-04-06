import type { Pet } from "../types";

interface PetHeaderProps {
  pet: Pet;
}

export default function PetHeader({ pet }: PetHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-5 rounded-xl bg-white p-5 shadow-sm">
      <img
        src={pet.avatar}
        alt={pet.name}
        className="h-20 w-20 rounded-full border-2 border-indigo-200 object-cover"
      />
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-800">{pet.name}</h2>
        <p className="text-sm text-gray-500">
          {pet.species} · {pet.breed} · {pet.age} · {pet.weight}
        </p>
      </div>
      {pet.allergies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pet.allergies.map((a) => (
            <span
              key={a}
              className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
            >
              ⚠ {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
