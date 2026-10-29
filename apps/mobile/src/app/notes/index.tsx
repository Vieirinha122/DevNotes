import { type Href, useRouter } from "expo-router";
import { Plus, Search, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExcluirNota } from "@/hooks/api/useExcluirNota";
import { useNotas } from "@/hooks/api/useNotas";
import { useDebounce } from "@/hooks/useDebounce";
import { NoteCard } from "@/screens/notes/components/NoteCard";
import { cores, espacamento } from "@/styles/tokens";

/**
 * Tela lista de notas — fetch paginado (infinite scroll) + busca.
 *
 * UI: edge-to-edge (headerShown desativado no Stack).
 * - Safe area no topo (notch/status bar)
 * - Barra de busca fixa no topo (com ícone lucide)
 * - FlatList infinito de NoteCard (swipe pra deletar, tap pra editar)
 * - FAB fixo no bottom-right com ícone (respecta soft nav bar Android)
 *
 * Cache do TanStack Query invalida automaticamente quando o
 * usuário sai/entra (política staleTime 5min).
 *
 * Acessibilidade:
 * - Inputs com accessibilityLabel
 * - FAB com accessibilityRole=button + label
 * - Empty state descritivo
 * - Estado de erro com retry como TouchableOpacity (não Text)
 */
export default function TelaListaNotas() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busca, setBusca] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  const buscaDebounced = useDebounce(busca.trim(), 350);

  // TanStack infinite query — carrega notas pagina por página
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useNotas(buscaDebounced ? { search: buscaDebounced } : undefined);

  const { mutate: excluirNota } = useExcluirNota();

  // Flatten de todas as páginas num array plano
  const notas = data?.pages.flatMap((pagina) => pagina.notas) ?? [];

  const isBuscando = Boolean(busca.trim()) && (isFetching || busca.trim() !== buscaDebounced);

  // Busca dispara refetch quando a key muda (filtros incluídos na queryKey)
  const handleBuscar = (texto: string) => {
    setBusca(texto);
  };

  const handleRefresh = async () => {
    setAtualizando(true);
    try {
      await refetch();
    } finally {
      setAtualizando(false);
    }
  };

  // Carrega mais quando o usuário chega no fim da FlatList
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Tap no card → abre edição
  const handleEditar = (id: string) => {
    router.push(`/notes/editar/${id}` as Href);
  };

  // Loading inicial (apenas quando o app acabou de abrir e não há nada em cache)
  if (isLoading && notas.length === 0 && !buscaDebounced) {
    return (
      <View style={[estilos.central, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={cores.primary} />
      </View>
    );
  }

  // Estado de erro — retry como TouchableOpacity (recebe feedback visual)
  if (isError && notas.length === 0) {
    return (
      <View style={[estilos.central, { paddingTop: insets.top }]}>
        <Text style={[estilos.erro, { color: cores.error }]}>
          {error?.message ?? "Erro ao carregar notas"}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
          accessibilityHint="Recarrega a lista de notas"
        >
          <Text style={estilos.botaoTentar}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.container}>
      {/* Safe area top — notch/status bar */}
      <View style={{ height: insets.top, backgroundColor: cores.background }} />

      {/* Barra de busca fixa */}
      <View style={estilos.buscadorContainer}>
        <View style={estilos.buscadorContainerInput}>
          <Search
            size={18}
            color={cores.foregroundMutedForeground}
            strokeWidth={1.5}
            style={estilos.buscadorIcon}
          />
          <TextInput
            style={estilos.buscador}
            placeholder="Buscar notas..."
            placeholderTextColor={cores.foregroundMutedForeground}
            value={busca}
            onChangeText={handleBuscar}
            accessibilityLabel="Buscar notas"
            accessibilityHint="Digite para filtrar notas por título ou conteúdo"
            returnKeyType="search"
          />
          {isBuscando ? (
            <ActivityIndicator
              size="small"
              color={cores.foregroundMutedForeground}
              style={estilos.buscadorAcao}
            />
          ) : busca.length > 0 ? (
            <TouchableOpacity
              onPress={() => setBusca("")}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={estilos.buscadorAcao}
            >
              <X size={16} color={cores.foregroundMutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Lista infinita de notas */}
      <FlatList
        data={notas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            nota={item}
            onEditar={handleEditar}
            onExcluir={() => excluirNota({ id: item.id, version: 0 })}
          />
        )}
        contentContainerStyle={{
          paddingBottom: 80 + insets.bottom,
          paddingTop: 12,
        }}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator color={cores.primary} /> : null
        }
        onRefresh={handleRefresh}
        refreshing={atualizando}
        ListEmptyComponent={
          isBuscando ? (
            <View style={estilos.emptyState}>
              <ActivityIndicator size="small" color={cores.primary} />
            </View>
          ) : (
            <View style={estilos.emptyState}>
              <Text style={estilos.emptyIcon}>📝</Text>
              <Text style={estilos.emptyTitulo}>Nenhuma nota encontrada</Text>
              <Text style={estilos.emptySubtitulo}>
                {busca ? "Tente outra busca ou " : "Crie sua primeira nota "}
                <Text
                  style={estilos.emptyLink}
                  onPress={() => (busca ? setBusca("") : router.push("/notes/nova" as Href))}
                >
                  {busca ? "limpe a busca" : "clicando + abaixo"}
                </Text>
              </Text>
            </View>
          )
        }
      />

      {/* FAB — cria nova nota */}
      <TouchableOpacity
        style={[estilos.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => router.push("/notes/nova" as Href)}
        accessibilityRole="button"
        accessibilityLabel="Criar nova nota"
        accessibilityHint="Abre o formulário para criar uma nova nota"
      >
        <Plus size={24} color={cores.primaryForeground} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.background,
  },
  buscadorContainer: {
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
  },
  buscadorContainerInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: cores.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  buscadorIcon: {
    marginRight: 8,
  },
  buscador: {
    flex: 1,
    color: cores.foreground,
    paddingVertical: 14,
    fontSize: 15,
  },
  buscadorAcao: {
    padding: 6,
    marginLeft: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  central: {
    flex: 1,
    backgroundColor: cores.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  erro: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  botaoTentar: {
    color: cores.primary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: espacamento.sm,
  },
  vazio: {
    color: cores.foregroundMutedForeground,
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.5,
  },
  emptyTitulo: {
    color: cores.foregroundMuted,
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubtitulo: {
    color: cores.foregroundMutedForeground,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  emptyLink: {
    color: cores.primary,
    textDecorationLine: "underline",
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cores.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabTexto: {
    color: cores.primaryForeground,
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 28,
  },
});
