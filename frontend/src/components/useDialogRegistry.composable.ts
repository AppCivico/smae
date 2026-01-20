import { type MaybeRefOrGetter, toValue } from 'vue';

/**
 * Composable para rastrear IDs de diálogos ativos e prevenir duplicatas
 */

const activeDialogIds = new Set<string>();

export function useDialogRegistry(id: MaybeRefOrGetter<string | number>) {
  function register() {
    const dialogId = String(toValue(id));

    if (import.meta.env.DEV && activeDialogIds.has(dialogId)) {
      console.warn(
        `[SmaeDialog] Múltiplos componentes SmaeDialog com id="${dialogId}" detectados. `
        + 'Isso pode causar conflitos de ID no DOM. Certifique-se de usar IDs únicos para cada diálogo.',
      );
    }

    activeDialogIds.add(dialogId);
  }

  function unregister() {
    const dialogId = String(toValue(id));
    activeDialogIds.delete(dialogId);
  }

  return {
    register,
    unregister,
  };
}
