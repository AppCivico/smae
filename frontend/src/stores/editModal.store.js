import { defineStore } from 'pinia';

export const useEditModalStore = defineStore({
    id: 'editModal',
    state: () => ({
        editModal: null
    }),
    actions: {
        modal(title,content,classes) {
            this.editModal = { 
                title:title, 
                content:content, 
                type:classes
            };
        },
        clear() {
            this.editModal = null;
        }
    }
});
