<script setup lang="ts">
import type { TransferenciaRespOperacao } from '@back/pessoa/dto/responsabilidade-pessoa.dto';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import {
  computed, reactive, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Dashboard } from '@/components';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import SelecionarTudo from '@/components/camposDeFormulario/SelecionarTudo/SelecionarTudo.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import schema from '@/consts/formSchemas/responsabilidadesDePessoa';
import módulosDoSistema from '@/consts/modulosDoSistema';
import operacoesDeResponsabilidade from '@/consts/operacoesDeResponsabilidade';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useResponsabilidadesDePessoaStore } from '@/stores/responsabilidadesDePessoa.store';

type Valores = {
  metas: number[];
  operacao: TransferenciaRespOperacao | null;
  nova_pessoa_id: number | null;
};

// privilégios que o GET /pdm aceita; sem eles a lista de metas não é filtrada por programa
const PRIVILEGIOS_PARA_LISTAR_PLANOS = [
  'PDM.ponto_focal',
  'PDM.tecnico_cp',
  'PDM.admin_cp',
  'CadastroPdm.inserir',
  'CadastroPdm.ativar',
  'CadastroPdm.editar',
  'CadastroPdm.inativar',
];

const route = useRoute();
const router = useRouter();

const alertStore = useAlertStore();
const authStore = useAuthStore();
const organsStore = useOrgansStore();
const responsabilidadesStore = useResponsabilidadesDePessoaStore();

const { órgãosPorId } = storeToRefs(organsStore);
const {
  metas, planos, pessoas, pessoasPorId, chamadasPendentes, erros,
} = storeToRefs(responsabilidadesStore);

const valoresIniciais: Valores = { metas: [], operacao: null, nova_pessoa_id: null };

const {
  errors, handleSubmit, resetForm, setFieldValue, values,
} = useForm<Valores>({
  validationSchema: schema,
  initialValues: valoresIniciais,
});

const ultimoResultado = ref('');

const funcionalidadeDisponivel = computed(() => authStore.rotaEhPermitida('responsabilidadesDeUsuários'));
const podeListarPlanos = computed(() => authStore.temPermissãoPara(PRIVILEGIOS_PARA_LISTAR_PLANOS));

const origemId = computed(() => Number(route.query.pessoa_id) || null);
const pdmId = computed(() => Number(route.query.pdm_id) || undefined);

const origem = computed(() => (origemId.value ? pessoasPorId.value[origemId.value] ?? null : null));
const destino = computed(() => (values.nova_pessoa_id
  ? pessoasPorId.value[values.nova_pessoa_id] ?? null
  : null));

const operacaoEscolhida = computed(() => (values.operacao
  ? operacoesDeResponsabilidade[values.operacao]
  : null));

const candidatosADestino = computed(() => {
  if (!origem.value?.orgao_id) return [];

  return pessoas.value.filter((p) => p.orgao_id === origem.value?.orgao_id
    && p.id !== origem.value?.id);
});

const idsDasMetas = computed(() => metas.value.map((m) => m.id));

const bloquearEnvio = computed(() => chamadasPendentes.value.execucao
  || (operacaoEscolhida.value?.exigeDestino && !!destino.value?.desativado));

const controladorDeOrigem = reactive({ busca: '', participantes: [] as number[] });

function trocarOrigem(id: number | null) {
  router.replace({ query: { ...route.query, pessoa_id: id || undefined } });
}

function trocarPlano(valor: string) {
  router.replace({ query: { ...route.query, pdm_id: Number(valor) || undefined } });
}

function rotuloDeMetas(quantidade: number) {
  return quantidade === 1 ? '1 meta' : `${quantidade} metas`;
}

function montarConfirmacao(valores: Valores, nomeOrigem: string, nomeDestino: string): string {
  const metasTexto = rotuloDeMetas(valores.metas.length);
  const pronome = valores.metas.length === 1 ? 'ela' : 'elas';

  switch (valores.operacao) {
    case 'transferir':
      return `Transferir a responsabilidade de ${metasTexto} de ${nomeOrigem} para ${nomeDestino}? ${nomeOrigem} deixará de ser responsável por ${pronome}.`;
    case 'copiar':
      return `Copiar a responsabilidade de ${metasTexto} de ${nomeOrigem} para ${nomeDestino}? As duas pessoas ficarão responsáveis.`;
    case 'remover':
      return `Remover ${nomeOrigem} da responsabilidade de ${metasTexto}? Ninguém será colocado no lugar.`;
    default:
      return '';
  }
}

function montarResultado(valores: Valores, nomeOrigem: string, nomeDestino: string): string {
  const metasTexto = rotuloDeMetas(valores.metas.length);

  switch (valores.operacao) {
    case 'transferir':
      return `Responsabilidade de ${metasTexto} transferida de ${nomeOrigem} para ${nomeDestino}.`;
    case 'copiar':
      return `Responsabilidade de ${metasTexto} copiada de ${nomeOrigem} para ${nomeDestino}.`;
    case 'remover':
      return `Responsabilidade de ${nomeOrigem} removida de ${metasTexto}.`;
    default:
      return '';
  }
}

function buscarMetas() {
  if (!origemId.value) return Promise.resolve();

  return responsabilidadesStore.buscarMetas({ pessoa_id: origemId.value, pdm_id: pdmId.value });
}

const onSubmit = handleSubmit(async (valores) => {
  if (bloquearEnvio.value || !origem.value || !operacaoEscolhida.value) return;

  const pessoaDeOrigem = origem.value;
  const { exigeDestino, nome } = operacaoEscolhida.value;
  const nomeDestino = exigeDestino ? destino.value?.nome_exibicao || '' : '';

  alertStore.confirmAction(
    montarConfirmacao(valores, pessoaDeOrigem.nome_exibicao, nomeDestino),
    async () => {
      const sucesso = await responsabilidadesStore.executar({
        origem_pessoa_id: pessoaDeOrigem.id,
        // a API exige um id inteiro mesmo ao remover e ignora o valor nesse caso
        nova_pessoa_id: exigeDestino ? valores.nova_pessoa_id : pessoaDeOrigem.id,
        operacao: valores.operacao as TransferenciaRespOperacao,
        metas: valores.metas,
      });

      if (!sucesso) return;

      ultimoResultado.value = montarResultado(valores, pessoaDeOrigem.nome_exibicao, nomeDestino);
      alertStore.success(ultimoResultado.value);
      resetForm({ values: { ...valoresIniciais, operacao: valores.operacao } });
      await buscarMetas();
    },
    nome,
  );
});

watch(origemId, (id) => {
  controladorDeOrigem.participantes = id ? [id] : [];
}, { immediate: true });

watch(() => values.nova_pessoa_id, (id) => {
  if (id && !pessoasPorId.value[id]) {
    responsabilidadesStore.buscarPessoa(id);
  }
});

watch(funcionalidadeDisponivel, (disponivel) => {
  if (!disponivel) return;

  responsabilidadesStore.buscarPessoas();

  if (podeListarPlanos.value) {
    responsabilidadesStore.buscarPlanos();
  }
}, { immediate: true });

watch([origemId, pdmId, funcionalidadeDisponivel], ([id, , disponivel], anterior) => {
  const origemMudou = !anterior || id !== anterior[0];

  resetForm({ values: { ...valoresIniciais, operacao: values.operacao ?? null } });

  if (origemMudou) {
    ultimoResultado.value = '';
  }

  if (!disponivel || !id) {
    metas.value = [];
    return;
  }

  if (!pessoasPorId.value[id]) {
    responsabilidadesStore.buscarPessoa(id);
  }

  buscarMetas();
}, { immediate: true });
</script>

<template>
  <Dashboard>
    <CabecalhoDePagina />

    <ErrorComponent
      v-if="!funcionalidadeDisponivel"
      class="mb2"
    >
      Esta funcionalidade está disponível apenas no módulo
      "{{ módulosDoSistema.PDM?.nome || 'PDM' }}", para quem pode editar
      responsabilidades de usuários.
    </ErrorComponent>

    <template v-else>
      <p class="tc400 mb2">
        Escolha uma pessoa para ver as metas pelas quais ela é responsável
        (na própria meta, em iniciativas, atividades, variáveis dos indicadores
        ou etapas do cronograma) e transferir, copiar ou remover essas
        responsabilidades.
      </p>

      <div class="flex flexwrap g2 mb2">
        <div class="f2 fb20em">
          <label
            class="label"
            for="pessoa_de_origem"
          >Pessoa</label>

          <AutocompleteField
            id="pessoa_de_origem"
            unique
            :controlador="controladorDeOrigem"
            :grupo="pessoas"
            label="nome_exibicao"
            placeholder="Buscar pessoa pelo nome"
            :aria-busy="chamadasPendentes.pessoas"
            @change="trocarOrigem"
          />

          <LoadingComponent v-if="chamadasPendentes.pessoas" />
          <ErrorComponent v-else-if="erros.pessoas">
            {{ erros.pessoas }}
          </ErrorComponent>
        </div>

        <div
          v-if="podeListarPlanos"
          class="f1 fb15em"
        >
          <label
            class="label"
            for="pdm_id"
          >Programa de metas</label>

          <select
            id="pdm_id"
            class="inputtext light mb1"
            :value="pdmId ?? ''"
            :aria-busy="chamadasPendentes.planos"
            @change="trocarPlano(($event.target as HTMLSelectElement).value)"
          >
            <option value="">
              Todos
            </option>
            <option
              v-for="plano in planos"
              :key="plano.id"
              :value="plano.id"
            >
              {{ plano.nome }}{{ plano.ativo ? ' (ativo)' : '' }}
            </option>
          </select>
        </div>
      </div>

      <p
        v-if="ultimoResultado"
        class="p1 bgc50 mb2"
        role="status"
      >
        {{ ultimoResultado }}
      </p>

      <p
        v-if="!origemId"
        class="p1 bgc50 tc mb2"
      >
        Nenhuma pessoa escolhida.
      </p>

      <template v-else>
        <LoadingComponent v-if="chamadasPendentes.pessoa && !origem" />

        <dl
          v-if="origem"
          class="flex flexwrap g2 mb2"
        >
          <div class="f1">
            <dt class="t12 uc w700 mb05 tamarelo">
              Nome
            </dt>
            <dd>
              {{ origem.nome_completo }}
              <small
                v-if="origem.desativado"
                class="tc400"
              >(usuário desativado)</small>
            </dd>
          </div>
          <div class="f1">
            <dt class="t12 uc w700 mb05 tamarelo">
              Órgão
            </dt>
            <dd>
              {{ origem.orgao_id
                ? órgãosPorId[origem.orgao_id]?.sigla || origem.orgao_id
                : 'Sem órgão' }}
            </dd>
          </div>
        </dl>

        <LoadingComponent v-if="chamadasPendentes.metas" />

        <ErrorComponent
          v-else-if="erros.metas"
          class="mb2"
        >
          {{ erros.metas }}
        </ErrorComponent>

        <p
          v-else-if="!metas.length"
          class="p1 bgc50 tc mb2"
        >
          Esta pessoa não é responsável por nenhuma meta{{ pdmId ? ' neste programa' : '' }}.
        </p>

        <form
          v-else
          @submit.prevent="onSubmit"
        >
          <SmaeTable
            class="mb2"
            titulo="Metas sob responsabilidade da pessoa"
            :dados="metas"
            :colunas="[
              { chave: 'selecionado', atributosDaColuna: { class: 'col--minimum' } },
              { chave: 'codigo', label: 'Código', atributosDaColuna: { class: 'col--minimum' } },
              { chave: 'titulo', label: 'Título' },
            ]"
          >
            <template #cabecalho:selecionado>
              <SelecionarTudo
                :model-value="values.metas"
                :lista-de-opcoes="idsDasMetas"
                @update:model-value="setFieldValue('metas', $event as number[])"
              />
            </template>

            <template #celula:selecionado="{ linha }">
              <Field
                name="metas"
                type="checkbox"
                :value="linha.id"
                :aria-label="`Selecionar meta ${linha.codigo}`"
              />
            </template>
          </SmaeTable>

          <ErrorMessage
            name="metas"
            class="error-msg mb2"
          />

          <fieldset class="mb2">
            <legend class="label mb1">
              Operação
            </legend>

            <label
              v-for="operacao in operacoesDeResponsabilidade"
              :key="operacao.valor"
              class="block mb1"
            >
              <Field
                name="operacao"
                type="radio"
                :value="operacao.valor"
                class="inputcheckbox"
                :disabled="operacao.exigeDestino && !origem?.orgao_id"
              />
              <span>
                <strong>{{ operacao.nome }}</strong>:
                {{ operacao.descricao }}
              </span>
            </label>

            <ErrorMessage
              name="operacao"
              class="error-msg"
            />

            <p
              v-if="origem && !origem.orgao_id"
              class="tc400 mt1"
            >
              Esta pessoa não pertence a nenhum órgão. Só é possível remover
              as responsabilidades dela.
            </p>
          </fieldset>

          <div
            v-if="operacaoEscolhida?.exigeDestino"
            class="mb2"
          >
            <label
              class="label"
              for="nova_pessoa_id"
            >Pessoa de destino <span class="tvermelho">*</span></label>

            <AutocompleteField
              v-if="candidatosADestino.length"
              unique
              name="nova_pessoa_id"
              :controlador="{
                busca: '',
                participantes: values.nova_pessoa_id ? [values.nova_pessoa_id] : [],
              }"
              :grupo="candidatosADestino"
              label="nome_exibicao"
              placeholder="Buscar pessoa do mesmo órgão"
            />
            <p
              v-else
              class="tc400"
            >
              Não há outras pessoas no órgão desta pessoa.
            </p>

            <ErrorMessage
              name="nova_pessoa_id"
              class="error-msg"
            />

            <p class="tc400 t12 mt1">
              Só aparecem pessoas do mesmo órgão. Responsabilidades de
              coordenação na CP só são passadas se a pessoa de destino também
              tiver esse perfil.
            </p>

            <ErrorComponent
              v-if="destino?.desativado"
              class="mt1"
            >
              {{ destino.nome_exibicao }} está com o usuário desativado e não
              pode receber responsabilidades.
            </ErrorComponent>
          </div>

          <p
            v-if="values.operacao === 'remover'"
            class="tc400 mb2"
          >
            As metas escolhidas podem ficar sem nenhuma pessoa responsável.
          </p>

          <SmaeFieldsetSubmit
            :rotulo="operacaoEscolhida
              ? `${operacaoEscolhida.nome} ${rotuloDeMetas(values.metas.length)}`
              : 'Executar'"
            :esta-carregando="chamadasPendentes.execucao"
            :aria-disabled="bloquearEnvio"
            :erros="errors"
          />
        </form>
      </template>
    </template>
  </Dashboard>
</template>
