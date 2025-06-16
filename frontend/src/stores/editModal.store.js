import { defineStore } from 'pinia';

export const useEditModalStore = defineStore('editModal', {
  state: () => ({
    editModal: null,
  }),
  actions: {
    modal(content, props, classes) {
      this.editModal = {
        props,
        content,
        type: classes,
      };
    },
    clear() { // TODO: remover função desnecessária. Pode-se usar `.$reset();`
      this.editModal = null;
    },
  },
});
