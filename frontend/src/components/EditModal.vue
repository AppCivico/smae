<script setup>
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { storeToRefs } from 'pinia';

const alertStore = useAlertStore();
const editModalStore = useEditModalStore();
const { editModal } = storeToRefs(editModalStore);
async function checkClose() {
  if (editModal.value.props?.checkClose) {
    editModal.value.props.checkClose();
  } else {
    alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
      router.go(-1);
      editModalStore.clear();
      alertStore.clear();
    });
  }
}
</script>

<template>
  <Teleport
    v-if="editModal"
    to="body"
  >
    <div
      class="editModal-wrap"
    >
      <div
        class="overlay"
        @click="checkClose"
      />
      <div
        class="editModal"
        :class="editModal.type"
      >
        <div>
          <editModal.content :props="editModal.props" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
