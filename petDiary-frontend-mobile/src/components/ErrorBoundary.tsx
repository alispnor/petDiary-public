import React, { Component, type ReactNode } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary global do mobile — captura crashes de componentes
 * React e mostra fallback amigável em vez do red screen do Metro.
 *
 * Não captura erros assíncronos (promises, setTimeout). Esses são
 * tratados pelos interceptors do api.ts e Alert.alert nos services.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.emoji}>😿</Text>
          <Text style={styles.title}>Algo deu errado</Text>
          <Text style={styles.subtitle}>
            Encontramos um erro inesperado. Toque em "Tentar novamente" para
            voltar à tela anterior.
          </Text>

          {this.state.error?.message ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} selectable>
                {this.state.error.message}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity onPress={this.handleReset} style={styles.btn}>
            <Text style={styles.btnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  emoji: { fontSize: 64 },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing[4],
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[2],
    textAlign: "center",
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: "#fee",
    borderRadius: radii.md,
    padding: spacing[3],
    marginTop: spacing[4],
    alignSelf: "stretch",
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#c00",
    fontFamily: "Courier",
  },
  btn: {
    backgroundColor: colors.brand.teal,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    marginTop: spacing[6],
  },
  btnText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
});
