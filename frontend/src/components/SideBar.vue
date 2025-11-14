<script setup>
import { storeToRefs } from 'pinia';

import { router } from '@/router';
import { useSideBarStore, useAlertStore } from '@/stores';

const alertStore = useAlertStore();
const SideBarStore = useSideBarStore();
const { SideBar } = storeToRefs(SideBarStore);
async function checkClose() {
  if (SideBar.value.props?.checkClose) {
    SideBar.value.props.checkClose();
  } else {
    SideBarStore.clear();
  }
}
</script>

<template>
  <div
    v-if="SideBar"
    class="sidebar-wrap"
  >
    <div
      class="overlay"
      @click="checkClose"
    />
    <div
      class="sidebar"
      :class="SideBar.classes"
    >
      <div>
        <div class="flex spacebetween center mb2">
          <div class="f1" />
          <span>
            <button
              class="btn round ml2"
              @click="checkClose"
            ><svg
              width="12"
              height="12"
            ><use xlink:href="#i_x" /></svg></button>
          </span>
        </div>
        <SideBar.content :props="SideBar.props" />
      </div>
    </div>
  </div>
</template>
