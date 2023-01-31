<script setup>
import { useAuthStore } from '@/stores';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;
</script>
<template>
  <div id="submenu">
    <div class="subpadding">
      <template
        v-if="perm?.CadastroPessoa
          || perm?.CadastroRegiao
          || perm?.CadastroPdm
          || perm?.Projeto?.administrador"
      >
        <h2>Entrada de dados</h2>
        <div class="links-container mb2">
          <router-link
            v-if="perm?.CadastroPessoa"
            to="/usuarios"
          >
            Gerenciar usuários
          </router-link>
          <router-link
            v-if="perm?.CadastroRegiao"
            to="/regioes"
          >
            Regiões, Subprefeituras e Distritos
          </router-link>
          <router-link
            v-if="perm?.CadastroPdm"
            to="/pdm"
            :class="{active: parentPage=='pdm'}"
          >
            Programa de Metas
          </router-link>
          <router-link
            v-if="perm?.Projeto?.administrador"
            :to="{ name: 'portfoliosListar' }"
            :class="{ active: parentPage == 'portfolio' }"
          >
            Portfolio
          </router-link>
        </div>
      </template>
      <template
        v-if="perm?.CadastroOrgao
          || perm?.CadastroFonteRecurso
          || perm?.CadastroTipoDocumento
          || perm?.CadastroOds"
      >
        <h2>Formulários básicos</h2>
        <div class="links-container mb2">
          <router-link
            v-if="perm?.CadastroOrgao"
            to="/orgaos"
          >
            Orgãos
          </router-link>
          <router-link
            v-if="perm?.CadastroFonteRecurso"
            to="/fonte-recurso"
          >
            Fontes de Recurso
          </router-link>
          <router-link
            v-if="perm?.CadastroTipoDocumento"
            to="/tipo-documento"
          >
            Tipos de Documento
          </router-link>
          <router-link
            v-if="perm?.CadastroOds"
            to="/ods"
          >
            ODS
          </router-link>
        </div>
      </template>

      <template v-if="perm?.CadastroPainel">
        <h2>Paineis de metas</h2>
        <div class="links-container mb2">
          <router-link
            v-if="perm?.CadastroPainel"
            to="/paineis"
          >
            Paineis de metas
          </router-link>
          <router-link
            v-if="perm?.CadastroPainel"
            to="/paineis-grupos"
          >
            Grupos de paineis
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>
