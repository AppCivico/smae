<script setup>
import { useAuthStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const podeAcessarPainéis = computed(() => perm?.CadastroPainel?.inserir
  || perm?.CadastroMeta?.inserir);
const podeAcessarGrupos = computed(() => perm?.CadastroGrupoPaineis?.inserir
  || perm?.CadastroGrupoPaineis?.editar || perm?.CadastroGrupoPaineis?.remover);
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
            Portfolios
          </router-link>
        </div>
      </template>
      <template
        v-if="perm?.CadastroOrgao
          || perm?.CadastroUnidadeMedida
          || perm?.CadastroTipoDocumento
          || perm?.CadastroOds"
      >
        <h2>Formulários básicos</h2>
        <div class="links-container mb2">
          <router-link
            v-if="perm?.CadastroOrgao"
            to="/orgaos"
          >
            Órgãos
          </router-link>
          <router-link
            v-if="perm?.CadastroUnidadeMedida"
            to="/unidade-medida"
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

      <template v-if="podeAcessarPainéis || podeAcessarGrupos">
        <h2>Painéis de metas</h2>
        <div class="links-container mb2">
          <router-link
            v-if="podeAcessarPainéis"
            to="/paineis"
          >
            Painéis de metas
          </router-link>
          <router-link
            v-if="podeAcessarGrupos"
            to="/paineis-grupos"
          >
            Grupos de paineis
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>
