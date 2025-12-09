<script lang="ts" setup>
import { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';

type Props = {
  valores: ListSeriesAgrupadas;
};

defineProps<Props>();

</script>

<template>
  categorica regionalizavel - {{ valores }}
</template>
