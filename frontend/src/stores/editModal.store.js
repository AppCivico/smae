import { defineStore } from 'pinia';

export const useEditModalStore = defineStore({
    id: 'editModal',
    state: () => ({
        editModal: null
    }),
    actions: {
        modal(content,props,classes) {
            this.editModal = {
                props:props,
                content:content,
                type:classes
            };
        },
        clear() {
            this.editModal = null;
        }
    }
});
