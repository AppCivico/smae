<script setup>
import { onMounted, onUpdated, ref } from 'vue';

const props = defineProps(['controlador', 'grupo', 'label']);
const control = ref(props.controlador);

function start() {
  control.value = props.controlador;
}
start();
onMounted(() => { start(); });
onUpdated(() => { start(); });

function removeParticipante(item, p) {
  item.participantes.splice(item.participantes.indexOf(p), 1);
}
function pushId(e, id) {
  e.push(id);
  e = [...new Set(e)];
}
function busca(e, item, g, label) {
  e.preventDefault();
  e.stopPropagation();
  if (e.keyCode === 13) {
    const i = g.find((x) => !item.participantes.includes(x.id)
      && x[label].toLowerCase().includes(item.busca.toLowerCase()));
    if (i) {
      pushId(item.participantes, i.id);
    }
    item.busca = '';
  }
}
</script>
<template>
  <template v-if="grupo?.length">
    <div class="suggestion search">
      <input
        v-model="control.busca"
        type="text"
        class="inputtext light mb05"
        @keyup.enter.stop.prevent="busca($event,control,grupo,label)"
      >
      <ul>
        <li
          v-for="r in grupo.filter((x) => !control.participantes.includes(x.id)
            && x[label]?.toLowerCase().includes(control.busca.toLowerCase()))"
          :key="r.id"
        >
          <a
            tabindex="1"
            @click="pushId(control.participantes,r.id)"
          >{{ r[label] }}</a>
        </li>
      </ul>
    </div>
    <span
      v-for="p in grupo.filter((x) => control.participantes.includes(x.id))"
      :key="p.id"
      class="tagsmall"
      @click="removeParticipante(control, p.id)"
    >{{ p[label] }}<svg
      width="12"
      height="12"
    ><use xlink:href="#i_x" /></svg></span>
  </template>
  <template v-else>
    <div class="search">
      <input
        type="text"
        disabled
        class="inputtext light mb05"
      >
    </div>
  </template>
</template>
