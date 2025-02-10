<script setup>
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
// import { storeToRefs } from 'pinia';
// import MenuSecundario from '@/components/MenuSecundario.vue';
// import { Nav } from '@/components';
// import { useAuthStore } from '@/stores/auth.store';
// import { useEditModalStore } from '@/stores/editModal.store';

// const editModalStore = useEditModalStore();
// const { editModal } = storeToRefs(editModalStore);
// const props = defineProps(['submenu', 'parentPage']);
// const authStore = useAuthStore();
// const { user } = storeToRefs(authStore);

function handleDeletar(linha) {
  alert(`Deletar ${JSON.stringify(linha)}`);
}
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<!-- <template>
  <Nav :activate="props?.submenu?.__name" />
  <component
    :is="submenu"
    v-if="submenu"
    :parent-page="parentPage"
  />
  <MenuSecundario
    v-else
    class="carregado-via-route.meta"
  />
  <main
    v-if="user"
    id="dashboard"
    :class="{ 'edit-modal': editModal }"
    v-bind="$attrs"
  >
    <slot />
  </main>
</template> -->

<template>
  <main style="padding-right: 30px;">
    <!-- @todo
      rolagemHorizontal
    -->
    <SmaeTable
      :dados="[
        { nome: 'Gustavo', idade: 27, empresa: { id: 1, nome: 'FGV' }, estado: 'RS' },
        { nome: 'Sobral', idade: 32, empresa: { id: 2, nome: 'APPCIVICO' }, estado: 'SP' },
        { nome: 'Shalders', idade: 78, empresa: { id: 1, nome: 'FGV' }, estado: 'ES' },
      ]"
      :colunas="[
        { chave: 'nome', label: 'Nome', cabecalho: true },
        { chave: 'idade', label: 'Idade'},
        { chave: 'empresa.nome', label: 'Empresa'},
        { chave: 'empresa.campo-errado', label: 'Empresa CAMPO ERRADO'},
        { chave: 'customizado', label: 'Campo customizado'},
      ]"
      :rota-editar="{ name: 'editarUsuários'}"
      parametro-no-objeto-para-editar="idade"
      parametro-no-objeto-para-excluir="nome"
      @deletar="handleDeletar"
    >
      <template #celula:customizado="{ caminho, linha }">
        campo: {{ caminho }}--{{ linha.nome }}-{{ linha.idade }}
        <input type="text">
      </template>

      <template #rodape>
        LAYOUT FOOTER
      </template>
    </SmaeTable>
  </main>
</template>
