import { defineStore } from 'pinia';

export const useSideBarStore = defineStore({
    id: 'SideBar',
    state: () => ({
        SideBar: null
    }),
    actions: {
        modal(content,props,classes) {
            this.SideBar = { 
                props:props, 
                content:content, 
                type:classes
            };
        },
        clear() {
            this.SideBar = null;
        }
    }
});
