interface RevokedModalProps {
  onDismiss: () => void;
}

export default function RevokedModal({ onDismiss }: RevokedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
          🔒
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">
          Acesso Revogado
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          O tutor revogou o PIN de acesso a este prontuário. Você será
          redirecionado à tela inicial.
        </p>
        <button
          onClick={onDismiss}
          className="rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
}
