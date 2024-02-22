<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

defineProps(['parentPage']);

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
          || perm?.Projeto?.administrar_portfolios"
      >
        <div class="links-container mb2">
          <router-link
            v-if="perm?.CadastroPessoa"
            to="/usuarios"
          >
            Gerenciar usuários
          </router-link>
          <router-link
            v-if="perm?.CadastroPdm"
            to="/pdm"
            :class="{active: parentPage=='pdm'}"
          >
            Programa de metas
          </router-link>
          <router-link
            v-if="perm?.Projeto?.administrar_portfolios"
            :to="{ name: 'portfoliosListar' }"
            :class="{ active: parentPage == 'portfolio' }"
          >
            Portfolios
          </router-link>

          <router-link
            v-if="perm?.Projeto?.administrar_portfolios"
            :to="{ name: 'tipoDeAcompanhamentoListar' }"
            :class="{ active: parentPage == 'portfolio' }"
          >
            Tipos de acompanhamento
          </router-link>

          <router-link
            v-if="perm?.CadastroPainelExterno"
            :to="{ name: 'paineisExternosListar' }"
          >
            Paineis externos
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
            Unidades de medida
          </router-link>
          <router-link
            v-if="perm?.CadastroTipoDocumento"
            to="/tipo-documento"
          >
            Tipos de documento
          </router-link>
          <router-link
            v-if="perm?.CadastroOds"
            to="/categorias"
          >
            Categorias
          </router-link>
          <router-link
            v-if="perm?.CadastroRegiao"
            to="/regioes"
          >
            Regiões, subprefeituras e distritos
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
