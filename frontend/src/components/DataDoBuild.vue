<script setup>
const frontendCommitDate = __FRONTEND_COMMIT_DATE__;
const backendCommitDate = __BACKEND_COMMIT_DATE__;

// eslint-disable-next-line no-console
console.log('[SMAE] versão front:', frontendCommitDate || '(desconhecida)');
// eslint-disable-next-line no-console
console.log('[SMAE] versão back:', backendCommitDate || '(desconhecida)');
</script>

<template>
  <dl
    v-if="frontendCommitDate || backendCommitDate"
    class="data-do-build"
  >
    <div v-if="frontendCommitDate">
      <dt>versão front:</dt>
      <dd>
        <span class="data-do-build__data">
          {{ frontendCommitDate.slice(0, 10) }}
        </span>
        <span class="data-do-build__hora">
          {{ frontendCommitDate.slice(10) }}
        </span>
      </dd>
    </div>
    <div v-if="backendCommitDate">
      <dt>versão back:</dt>
      <dd>
        <span class="data-do-build__data">
          {{ backendCommitDate.slice(0, 10) }}
        </span>
        <span class="data-do-build__hora">
          {{ backendCommitDate.slice(10) }}
        </span>
      </dd>
    </div>
  </dl>
</template>
