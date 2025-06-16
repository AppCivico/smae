import { defineStore } from 'pinia';

export const useSideBarStore = defineStore('SideBar', {
  state: () => ({
    SideBar: null,
  }),
  actions: {
    modal(content, props, classes) {
      this.SideBar = {
        props,
        content,
        type: classes,
      };
    },
    clear() {
      this.SideBar = null;
    },
  },
});
