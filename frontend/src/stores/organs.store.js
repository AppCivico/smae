import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useOrgansStore = defineStore({
    id: 'organs',
    state: () => ({
        organs: {},
    }),
    actions: {
        async getAll() {
            this.organs = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/orgao`);    
                this.organs = r.linhas;
            } catch (error) {
                this.organs = { error };
            }
        },
    }
});
