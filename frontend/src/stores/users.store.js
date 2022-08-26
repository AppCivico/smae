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
            try {
                let m = {
                  "email": params.email,
                  "nome_exibicao": params.nome_exibicao,
                  "nome_completo": params.nome_completo,
                  "lotacao": params.lotacao,
                  "orgao_id": params.orgao_id,
                  "perfil_acesso_ids": params.perfil_acesso_ids,
                };

                if(params.desativado){
                    m.desativado = params.desativado;
                    m.desativado_motivo = params.desativado_motivo;
                }

                let r = await requestS.patch(`${baseUrl}/pessoa/${id}`, m);
                const authStore = useAuthStore();
                if (id === authStore.user.id) {
                    const user = { ...authStore.user, ...params };
                    localStorage.setItem('user', JSON.stringify(user));
                    authStore.user = user;
                }
                this.users = {};
                return true;
            } catch (error) {
                this.user = { error };
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
                    return (f.orgao?u.orgao_id==f.orgao:1)&&(f.nomeemail?(u.nome_completo.includes(f.nomeemail)||u.email.includes(f.nomeemail)):1);
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
