<script setup>
import { ref, reactive } from 'vue';

const props = defineProps(['list']);

const np = ref(props.list.nao_preenchidas);
const acp = ref(props.list.aguarda_cp);
const ac = ref(props.list.aguarda_complementacao);
</script>
<template>
  <span
    v-if="np"
    class="tagcount"
  >{{ np }} variáv{{ np>1?'eis':'el' }} não preenchida{{ np>1?'s':'' }}</span>
  <span
    v-if="ac"
    class="tagcount bgs1"
  >{{ ac }} variáv{{ ac>1?'eis':'el' }} aguardando Complementação</span>
  <span
    v-if="acp"
    class="tagcount bgs2"
  >{{ acp }} variáv{{ acp>1?'eis':'el' }} aguardando CP</span>
</template>
