<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores';

const props = defineProps(['activate']);
let menuMobile = ref(0)
function toggleMenu() {
    menuMobile = !menuMobile.value;
}

const authStore = useAuthStore();
const { user/*, permissions*/ } = storeToRefs(authStore);
</script>

<template>
    <nav v-if="user" id="menu" class="only-desktop-menu" :class="{aberto: menuMobile}">
        <div class="top">
            <a href="javascript:void(0);" id="m_profile">
                <span class="profile-name">
                    {{user.nome_exibicao}}
                </span>
                <div>
                    <p>i</p>
                </div>
            </a>
            <router-link to="/" @click="toggleMenu" :class="{active: activate=='SubmenuConfig'}">
                <span>Entrada de dados</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M18 12V11.2V8.8V8.001H3.6L2 8V12H18ZM18 6V5.2V2.8V2.001H3.6L2 2V6H18ZM2 0H17.99C19.33 0 20 0.668 20 2V17.92C20 19.307 19.333 20 18 20H2C0.667 20 0 19.307 0 17.92V2C0 0.667 0.667 0 2 0ZM3.6 14H2V18H18V17.2V14.8V14.001H3.6V14ZM4 5C3.73478 5 3.48043 4.89464 3.29289 4.70711C3.10536 4.51957 3 4.26522 3 4C3 3.73478 3.10536 3.48043 3.29289 3.29289C3.48043 3.10536 3.73478 3 4 3C4.26522 3 4.51957 3.10536 4.70711 3.29289C4.89464 3.48043 5 3.73478 5 4C5 4.26522 4.89464 4.51957 4.70711 4.70711C4.51957 4.89464 4.26522 5 4 5ZM4 11C3.73478 11 3.48043 10.8946 3.29289 10.7071C3.10536 10.5196 3 10.2652 3 10C3 9.73478 3.10536 9.48043 3.29289 9.29289C3.48043 9.10536 3.73478 9 4 9C4.26522 9 4.51957 9.10536 4.70711 9.29289C4.89464 9.48043 5 9.73478 5 10C5 10.2652 4.89464 10.5196 4.70711 10.7071C4.51957 10.8946 4.26522 11 4 11ZM4 17C3.73478 17 3.48043 16.8946 3.29289 16.7071C3.10536 16.5196 3 16.2652 3 16C3 15.7348 3.10536 15.4804 3.29289 15.2929C3.48043 15.1054 3.73478 15 4 15C4.26522 15 4.51957 15.1054 4.70711 15.2929C4.89464 15.4804 5 15.7348 5 16C5 16.2652 4.89464 16.5196 4.70711 16.7071C4.51957 16.8946 4.26522 17 4 17Z"/>
                </svg>
            </router-link>
            <router-link to="/metas" @click="toggleMenu" :class="{active: activate=='SubmenuMetas'}">
                <span>Metas</span>
                <svg width="19" height="22" viewBox="0 0 19 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 0H8C7.46957 0 6.96086 0.210712 6.58578 0.585785C6.21071 0.960858 6 1.46957 6 2V14C6 14.5304 6.21071 15.0391 6.58578 15.4142C6.96086 15.7893 7.46957 16 8 16H17C17.5304 16 18.0391 15.7893 18.4142 15.4142C18.7893 15.0391 19 14.5304 19 14V4L15 0ZM17 14H8V2H13V6H17V14Z"/><path d="M5 5H3V17C3 17.5304 3.21071 18.0391 3.58578 18.4142C3.96086 18.7893 4.46957 19 5 19H14V17H5V5Z"/><path d="M0 8H2V20H11V22H2C1.46957 22 0.960858 21.7893 0.585785 21.4142C0.210712 21.0391 0 20.5304 0 20V8Z"/></svg>
            </router-link>
        </div>

        <div class="bottom">        
            <a @click="authStore.logout()">
                <span>Logout</span>
                <svg width="22" height="22" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V2zm1 13h8V2H4v13z"/><path d="M9 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"/></svg>
            </a>
            <router-link to="/usuarios" @click="toggleMenu">
                <span>Usuários</span>
                <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M18.2425 4.24239L18.2425 2H19.7577V4.24239H22.0001V5.75762H19.7577V8H18.2425L18.2425 5.75762H16.0001V4.24239H18.2425ZM11.0001 13.5294C13.0793 13.5294 14.7648 11.8439 14.7648 9.76471C14.7648 7.68552 13.0793 6 11.0001 6C8.92093 6 7.23541 7.68552 7.23541 9.76471C7.23541 11.8439 8.92093 13.5294 11.0001 13.5294ZM11.0001 14.4899C9.99473 14.4151 8.9853 14.5582 8.0402 14.9092C7.0951 15.2601 6.23687 15.811 5.524 16.5239C4.81112 17.2368 4.26024 18.0956 3.90927 19.0407C3.55831 19.9858 3.41522 20.9946 3.49001 22H18.5102C18.585 20.9946 18.4419 19.9858 18.091 19.0407C17.74 18.0956 17.1897 17.2368 16.4768 16.5239C15.764 15.811 14.9057 15.2601 13.9606 14.9092C13.0155 14.5582 12.0055 14.4151 11.0001 14.4899Z"/></svg>
            </router-link>
        </div>
    
        <div class="overlay only-desktop"></div>
    </nav>
</template>
<style lang="less">
    @import '@/_less/variables.less';
    #menu{
        position: fixed; left: 0; top: 0; bottom: 0; background: @primary; color: @amarelo; z-index: 11; .transition();
        a{
            font-weight: 700; display: block; padding: 23px 23px; border-bottom: 1px solid fadeOut(@c100,80%); .transition();
            span{
                display: inline-block; vertical-align: middle; overflow: hidden; width: 0; .opacity(0); height: 20px; line-height: 20px; .transition();
                &.profile-name {text-transform: capitalize;}
            }
            svg{
                display: inline-block; vertical-align: middle;
                *{.transition();}
            }
            &:hover{
                color: @amarelo; padding-top: 40px; padding-bottom: 40px;
            }
            &:active, &.active, &.inv{
                background: @amarelo; color: @primary;
            }
            &#m_profile {
                background-color: #07141A;
                div {
                    position: relative; right: 3px; top: 1px;
                    display: inline-block; height: 25px; width: 25px;
                    border: 3px solid @amarelo; border-radius: 50%;
                    color: @amarelo;
                    p{
                        line-height:19px; margin: 0 2px 0 1px; text-align: center;
                    }
                }
            }
        }
        .bottom {
            position:absolute; bottom:0; width:100%;
        }
        &:hover{
            .bs(0 0 40px 20px fadeOut(black,80%));
            a{
                span{width: 120px; .opacity(1);}
            }
        }

        @media(max-height: 570px){
            a{
                padding: 15px;
                &:hover{padding: 15px;}
            }
        }
    }
</style>