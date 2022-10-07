import { storeToRefs } from 'pinia';
import { useMetasStore } from '@/stores';
import { router } from '@/router';

export const AtividadeAtiva = (async()=>{
    const MetasStore = useMetasStore();
    const { activePdm } = storeToRefs(MetasStore);
    await MetasStore.getPdM();
    if(!activePdm.value.possui_atividade) router.go(-1);
});