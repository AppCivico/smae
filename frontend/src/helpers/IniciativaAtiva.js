import { storeToRefs } from 'pinia';
import { useMetasStore } from '@/stores';
import { router } from '@/router';

export const IniciativaAtiva = (async()=>{
    const MetasStore = useMetasStore();
    const { activePdm } = storeToRefs(MetasStore);
    await MetasStore.getPdM();
    if(!activePdm.value.possui_iniciativa) router.go(-1);
});