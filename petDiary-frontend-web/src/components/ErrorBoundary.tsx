import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary global — captura crashes de componentes React e mostra
 * uma tela amigável em vez da tela branca. Botão "Recarregar" reseta o
 * estado e tenta de novo; se persistir, oferece logout/voltar ao login.
 *
 * Note que isto NÃO captura erros assíncronos (promises rejeitadas,
 * setTimeout). Esses são tratados pelos interceptors do axios e pelos
 * try/catch nos services.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHardReload = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12 text-center">
        <div className="max-w-md">
          <div className="text-6xl">😿</div>
          <h1 className="mt-4 text-2xl font-bold text-gray-800">
            Algo deu errado
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Encontramos um erro inesperado e a tela não pôde ser carregada.
            Tente novamente; se persistir, recarregue a página inteira.
          </p>

          {this.state.error?.message && (
            <pre className="mt-4 overflow-auto rounded-md bg-red-50 p-3 text-left text-xs text-red-700">
              {this.state.error.message}
            </pre>
          )}

          <div className="mt-6 flex gap-2 justify-center">
            <button
              onClick={this.handleReset}
              className="rounded-pill bg-brand-teal px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Tentar novamente
            </button>
            <button
              onClick={this.handleHardReload}
              className="rounded-pill bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Recarregar app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
