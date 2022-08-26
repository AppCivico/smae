import { defineStore } from 'pinia';
import { requestS } from '@/helpers';
import { useAuthStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useUsersStore = defineStore({
    id: 'users',
    state: () => ({
        accessProfiles: {},
        users: {},
        user: {},
        temp: {}
    }),
    actions: {
        clear (){
            this.accessProfiles = {};
            this.users = {};
            this.user = {};
            this.temp = {};
        },
        async register(user) {
            await requestS.post(`${baseUrl}/pessoa`, user);
        },
        async getAll() {
            this.users = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/pessoa`);    
                this.users = r.linhas;
            } catch (error) {
                this.users = { error };
            }
        },
        /*async getById(id) {
            this.user = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/pessoa/${id}`);
                this.user = r.linhas;
            } catch (error) {
                this.user = { error };
            }
        },*/
        async getById(id) {
            this.user = { loading: true };
            try {
                if(!this.users.length){
                    await this.getAll();
                }
                this.user = this.users.find((u)=>u.id == id);
                if(!this.user) throw 'Usuário não encontrado';
            } catch (error) {
                this.user = { error };
            }
        },
        async update(id, params) {
            await requestS.patch(`${baseUrl}/pessoa/${id}`, params);
            const authStore = useAuthStore();
            if (id === authStore.user.id) {
                const user = { ...authStore.user, ...params };
                localStorage.setItem('user', JSON.stringify(user));
                authStore.user = user;
            }
        },
        /*async delete(id) {
            const authStore = useAuthStore();
            if(id !== authStore.user.id){
                this.users.find(x => x.id === id).isDeleting = true;
                await requestS.delete(`${baseUrl}/deletar-usuario/${id}`);
                this.users = this.users.filter(x => x.id !== id);
            }
        }*/
        async filterUsers(f){
            this.temp = { loading: true };
            try {
                if(!this.users.length){
                    await this.getAll();
                }
                this.temp = f ? this.users.filter((u) =>{
                    return (f.orgao?u.orgao==f.orgao:1)&&(f.nomeemail?(u.nome_completo.includes(f.nomeemail)||u.email.includes(f.nomeemail)):1);
                }) : this.users;
            } catch (error) {
                this.user = { error };
            }
        },
        async getProfiles() {
            this.accessProfiles = { loading: true };
            try {
                let r = await requestS.get(`${baseUrl}/perfil-de-acesso`);    
                this.accessProfiles = r.linhas;
            } catch (error) {
                this.accessProfiles = { error };
            }
        },
    }
});
