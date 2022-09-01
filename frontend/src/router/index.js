import { createRouter, createWebHistory } from 'vue-router';

// Stores
import { useAuthStore } from '@/stores';

// Views
import { Home } from '@/views';
import { Login, LostPassword, NewPassword } from '@/views/auth';
import { AddEditUsers, ListUsers } from '@/views/users';
import { AddEditOrgans, ListOrgans, AddEditOrganTypes, ListOrganTypes } from '@/views/organs';
import { AddEditResources, ListResources } from '@/views/resources';
import { AddEditDocumentTypes, ListDocumentTypes } from '@/views/documentTypes';
import { AddEditODS, ListODS } from '@/views/ods';


export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    linkActiveClass: 'active',
    routes: [
        { path: '/', component: Home },
        { path: '/login', component: Login },
        { path: '/esqueci-minha-senha', component: LostPassword },
        { path: '/nova-senha', component: NewPassword },
        { path: '/usuarios',
            children: [
                { path: '', component: ListUsers },
                { path: 'novo', component: AddEditUsers },
                { path: 'editar/:id', component: AddEditUsers }
            ]
        },
        { path: '/orgaos',
            children: [
                { path: '', component: ListOrgans },
                { path: 'novo', component: AddEditOrgans },
                { path: 'editar/:id', component: AddEditOrgans },
                { path: 'tipos', component: ListOrganTypes },
                { path: 'tipos/novo', component: AddEditOrganTypes },
                { path: 'tipos/editar/:id', component: AddEditOrganTypes }
            ]
        },
        { path: '/fonte-recurso',
            children: [
                { path: '', component: ListResources },
                { path: 'novo', component: AddEditResources },
                { path: 'editar/:id', component: AddEditResources },
            ]
        },
        { path: '/tipo-documento',
            children: [
                { path: '', component: ListDocumentTypes },
                { path: 'novo', component: AddEditDocumentTypes },
                { path: 'editar/:id', component: AddEditDocumentTypes },
            ]
        },
        { path: '/ods',
            children: [
                { path: '', component: ListODS },
                { path: 'novo', component: AddEditODS },
                { path: 'editar/:id', component: AddEditODS },
            ]
        },
        { path: '/:pathMatch(.*)*', redirect: '/' }
    ]
});

router.beforeEach(async (r) => {
    const publicPages = ['/login', '/esqueci-minha-senha', '/nova-senha'];
    const authRequired = !publicPages.includes(r.path);
    const authStore = useAuthStore();

    if (authRequired && !authStore.user) {
        authStore.returnUrl = r.fullPath;
        return '/login';
    }
    if(r.path=='/nova-senha' && !authStore.reducedtoken){
        return '/login';
    }
});
