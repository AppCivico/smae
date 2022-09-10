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
import { ListRegions } from '@/views/regions';

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
                { path: 'tipos', component: ListOrganTypes, props:{submenu:SubmenuConfig}  },
                { path: 'tipos/novo', component: AddEditOrganTypes, props:{submenu:SubmenuConfig}  },
                { path: 'tipos/editar/:id', component: AddEditOrganTypes, props:{submenu:SubmenuConfig}  }
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
                { path: ':pdm_id', component: AddEditPdM, props:{submenu:SubmenuConfig} },
                { path: ':pdm_id/macrotemas/novo', component: ListPdM, props:{type:"novo",group:"macrotemas",submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: ':pdm_id/macrotemas/:id', component: ListPdM, props:{type:"editar",group:"macrotemas",submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: ':pdm_id/temas/novo', component: ListPdM, props:{type:"novo",group:"temas",submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: ':pdm_id/temas/:id', component: ListPdM, props:{type:"editar",group:"temas",submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: ':pdm_id/tags/novo', component: ListPdM, props:{type:"novo",group:"tags",submenu:SubmenuConfig, parentPage: 'pdm'} },
                { path: ':pdm_id/tags/:id', component: ListPdM, props:{type:"editar",group:"tags",submenu:SubmenuConfig, parentPage: 'pdm'} },
            ]
        },
        { path: '/regioes',
            children: [
                { path: '', component: ListRegions, props:{submenu:SubmenuConfig} },
                { path: 'novo', component: ListRegions, props:{type:"novo", submenu:SubmenuConfig} },
                { path: 'novo/:id', component: ListRegions, props:{type:"novo", submenu:SubmenuConfig} },
                { path: 'novo/:id/:id2', component: ListRegions, props:{type:"novo", submenu:SubmenuConfig} },
                { path: 'novo/:id/:id2/:id3', component: ListRegions, props:{type:"novo", submenu:SubmenuConfig} },
                { path: 'editar/:id', component: ListRegions, props:{type:"editar", submenu:SubmenuConfig}  },
                { path: 'editar/:id/:id2', component: ListRegions, props:{type:"editar", submenu:SubmenuConfig}  },
                { path: 'editar/:id/:id2/:id3', component: ListRegions, props:{type:"editar", submenu:SubmenuConfig}  },
                { path: 'editar/:id/:id2/:id3/:id4', component: ListRegions, props:{type:"editar", submenu:SubmenuConfig}  },
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
