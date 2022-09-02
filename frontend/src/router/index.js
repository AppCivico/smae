import { createRouter, createWebHistory } from 'vue-router';

// Stores
import { useAuthStore } from '@/stores';

// Views
import { Home } from '@/views';
import { default as SubmenuConfig } from '@/components/SubmenuConfig.vue';
import { Login, LostPassword, NewPassword } from '@/views/auth';
import { AddEditUsers, ListUsers } from '@/views/users';
import { AddEditOrgans, ListOrgans, AddEditOrganTypes, ListOrganTypes } from '@/views/organs';
import { AddEditResources, ListResources } from '@/views/resources';
import { AddEditDocumentTypes, ListDocumentTypes } from '@/views/documentTypes';
import { AddEditODS, ListODS } from '@/views/ods';
import { AddEditPdM, ListPdM } from '@/views/pdm';
import { AddEditAxes, ListAxes } from '@/views/axes';
import { AddEditTags, ListTags } from '@/views/tags';
import { AddEditStrategicObjectives, ListStrategicObjectives } from '@/views/strategicObjectives';
import { AddEditRegions, ListRegions } from '@/views/regions';

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    linkActiveClass: 'active',
    routes: [
        { path: '/', name: 'home', component: Home, props:{submenu:SubmenuConfig} },
        { path: '/login', component: Login },
        { path: '/esqueci-minha-senha', component: LostPassword },
        { path: '/nova-senha', component: NewPassword },
        { path: '/usuarios',
            children: [
                { path: '', component: ListUsers, props:{submenu:SubmenuConfig} },
                { path: 'novo', component: AddEditUsers, props:{submenu:SubmenuConfig} },
                { path: 'editar/:id', component: AddEditUsers, props:{submenu:SubmenuConfig} }
            ]
        },
        { path: '/orgaos',
            children: [
                { path: '', component: ListOrgans, props:{submenu:SubmenuConfig} },
                { path: 'novo', component: AddEditOrgans, props:{submenu:SubmenuConfig} },
                { path: 'editar/:id', component: AddEditOrgans, props:{submenu:SubmenuConfig} },
                { path: 'tipos', component: ListOrganTypes },
                { path: 'tipos/novo', component: AddEditOrganTypes },
                { path: 'tipos/editar/:id', component: AddEditOrganTypes }
            ]
        },
        { path: '/fonte-recurso',
            children: [
                { path: '', component: ListResources, props:{submenu:SubmenuConfig} },
                { path: 'novo', component: AddEditResources, props:{submenu:SubmenuConfig} },
                { path: 'editar/:id', component: AddEditResources, props:{submenu:SubmenuConfig} },
            ]
        },
        { path: '/tipo-documento',
            children: [
                { path: '', component: ListDocumentTypes, props:{submenu:SubmenuConfig} },
                { path: 'novo', component: AddEditDocumentTypes, props:{submenu:SubmenuConfig} },
                { path: 'editar/:id', component: AddEditDocumentTypes, props:{submenu:SubmenuConfig} },
            ]
        },
        { path: '/ods',
            children: [
                { path: '', component: ListODS, props:{submenu:SubmenuConfig} },
                { path: 'novo', component: AddEditODS, props:{submenu:SubmenuConfig} },
                { path: 'editar/:id', component: AddEditODS, props:{submenu:SubmenuConfig} },
            ]
        },
        { path: '/pdm',
            children: [
                { path: '', component: ListPdM, props:{submenu:SubmenuConfig} },
                { path: 'novo', component: AddEditPdM, props:{submenu:SubmenuConfig} },
                { path: 'editar/:id', component: AddEditPdM, props:{submenu:SubmenuConfig} },
            ]
        },
        { path: '/eixos',
            children: [
                { path: '', component: ListAxes, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: 'novo', component: AddEditAxes, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: 'novo/:pdm_id', component: AddEditAxes, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: 'editar/:id', component: AddEditAxes, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
            ]
        },
        { path: '/tags',
            children: [
                { path: '', component: ListTags, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: 'novo', component: AddEditTags, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: 'novo/:pdm_id', component: AddEditTags, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: 'editar/:id', component: AddEditTags, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
            ]
        },
        { path: '/objetivos-estrategicos',
            children: [
                { path: '', component: ListStrategicObjectives, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: 'novo', component: AddEditStrategicObjectives, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: 'novo/:pdm_id', component: AddEditStrategicObjectives, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: 'editar/:id', component: AddEditStrategicObjectives, props:{submenu:SubmenuConfig, parentPage: 'pdm'} },
            ]
        },
        { path: '/regioes',
            children: [
                { path: '', component: ListRegions, props:{submenu:SubmenuConfig} },
                { path: 'novo', component: AddEditRegions, props:{type:"novo", submenu:SubmenuConfig} },
                { path: 'novo/:id', component: AddEditRegions, props:{type:"novo", submenu:SubmenuConfig} },
                { path: 'novo/:id/:id2', component: AddEditRegions, props:{type:"novo", submenu:SubmenuConfig} },
                { path: 'editar/:id', component: AddEditRegions, props:{type:"editar", submenu:SubmenuConfig}  },
                { path: 'editar/:id/:id2', component: AddEditRegions, props:{type:"editar", submenu:SubmenuConfig}  },
                { path: 'editar/:id/:id2/:id3', component: AddEditRegions, props:{type:"editar", submenu:SubmenuConfig}  },
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
