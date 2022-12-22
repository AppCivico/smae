<script setup>
import { router } from '@/router';
import { useAlertStore, useRelatoriosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import NovoOrcamentarioVue from '../../components/relatorios/NovoOrcamentario.vue';

const { loading, error } = storeToRefs(useRelatoriosStore());
let { current } = storeToRefs(useRelatoriosStore());


import { onMounted } from 'vue';

onMounted(() => {
  current = {};
});



const alertStore = useAlertStore();

const route = useRoute();


async function onSubmit(el) {
  event.preventDefault();
  event.stopPropagation();
  try {
    var msg;
    var r;
    var values = { valores: [] };
    el.target.querySelectorAll('[name]').forEach(x => {
      values.valores.push({
        referencia: x.name,
        valor: !isNaN(parseFloat(x.value)) ? String(parseFloat(x.value.replace(',', '.'))) : ''
      });
    });

    if (var_id) {
      r = await VariaveisStore.updateValores(values);
      if (r) {
        msg = 'Valores salvos com sucesso!';
        VariaveisStore.getValores(var_id);
        alertStore.success(msg);
        editModalStore.clear();
        router.push(`${currentEdit}`);
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', '/usuarios');
}

</script>

<template>
    <div class="flex spacebetween center mb2">
        <h1>{{ route.meta.título || route.name }}</h1>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <NovoOrcamentarioVue fonte="Orcamento" />
</template>
