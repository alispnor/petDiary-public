export default function AdminTickets() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💬 Suporte</h1>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-3xl">🚧</p>
        <h2 className="mt-3 font-bold text-gray-800">Em construção</h2>
        <p className="mt-2 text-sm text-gray-600">
          O modelo <code className="rounded bg-amber-100 px-1">SupportTicket</code> da Spec 03 ainda
          não foi implementado no backend.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Quando estiver pronto, esta tela mostrará a lista de tickets dos usuários
          (Dúvida, Reclamação, Ideia) com chat de resposta em layout split.
        </p>
      </div>
    </div>
  );
}
