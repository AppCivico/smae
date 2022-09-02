import { defineStore } from 'pinia';

import { requestS } from '@/helpers';
import { router } from '@/router';
import { useAlertStore } from '@/stores';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')),
        token: JSON.parse(localStorage.getItem('token')),
        reducedtoken: null,
        returnUrl: null,
        permissions: JSON.parse(localStorage.getItem('permissions'))
    }),
    actions: {
        async login(username, password) {
            try {
                const token = await requestS.post(`${baseUrl}/login`, { 'email': username, 'senha': password });    

                if(token.reduced_access_token){
                    this.reducedtoken = token.reduced_access_token;
                    router.push('/nova-senha');
                    return;
                }
                this.token = token.access_token;
                localStorage.setItem('token', JSON.stringify(token.access_token));
                
                const user = await requestS.get(`${baseUrl}/minha-conta`);    
                this.user = user.sessao;
                localStorage.setItem('user', JSON.stringify(user.sessao));
                
                this.setPermissions();

                router.push(this.returnUrl || '/');
            } catch (error) {
                const alertStore = useAlertStore();
                alertStore.error(error);                
            }
        },
        async passwordRecover(username) {
            try {
                await requestS.post(`${baseUrl}/solicitar-nova-senha`, { 'email': username });    
                const alertStore = useAlertStore();
                alertStore.success('Uma senha temporária foi enviada para o seu e-mail.');
                router.push('/login');
            } catch (error) {
                const alertStore = useAlertStore();
                alertStore.error(error);                
            }
        },
        async passwordRebuilt(password) {
            try {
                if(!this.reducedtoken){
                    router.push('/login');
                    return;
                }
                const token = await requestS.post(`${baseUrl}/escrever-nova-senha`, { 'reduced_access_token': this.reducedtoken, 'senha': password });    
                this.reducedtoken = null;
                this.token = token.access_token;
                localStorage.setItem('token', JSON.stringify(token.access_token));
                
                const user = await requestS.get(`${baseUrl}/minha-conta`);    
                this.user = user.sessao;
                localStorage.setItem('user', JSON.stringify(user.sessao));

                this.setPermissions();

                const alertStore = useAlertStore();
                alertStore.success("Senha salva com sucesso. Bem-vindo!");
                router.push(this.returnUrl || '/');
            } catch (error) {
                const alertStore = useAlertStore();
                alertStore.error(error);                
            }
        },
        logout() {
            requestS.post(`${baseUrl}/sair`);    
            this.user = null;
            this.token = null;
            this.permissions = null;
            this.reducedtoken = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            router.push('/login');
        },
        setPermissions(){
            var per = {};
            if(this.user.privilegios)this.user.privilegios.forEach(p=>{
                var c = p.split('.');
                if(c[1]){
                    if(!per[c[0]]) per[c[0]] = {};
                    per[c[0]][c[1]] = 1;
                }
            });

            localStorage.setItem('permissions', JSON.stringify(per));
            return this.permissions = per;
        }
    }
});
