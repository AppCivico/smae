import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useCiclosStore = defineStore({
    id: 'Ciclos',
    state: () => ({
        MetasCiclos: {},
    }),
    actions: {
        clear (){
            this.MetasCiclos = {};
        },
        async getMetas() {
            this.MetasCiclos = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/mf/metas/por-fase?via_cronograma=true&via_variaveis=true`);    
                this.MetasCiclos = r.linhas;
            } catch (error) {
                this.MetasCiclos = { error };
            }
        },
    }
});
