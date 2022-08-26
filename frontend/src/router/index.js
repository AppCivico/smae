import { createRouter, createWebHistory } from 'vue-router';

// Stores
import { useAuthStore } from '@/stores';

// Views
import { Home } from '@/views';
import { Login, LostPassword, NewPassword } from '@/views/auth';
import { AddEditUsers, ListUsers } from '@/views/users';


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
