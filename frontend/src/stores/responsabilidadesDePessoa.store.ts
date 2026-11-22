import type { ListPdmDto } from '@back/pdm/dto/list-pdm.dto';
import type { DetalhePessoaDto } from '@back/pessoa/dto/detalhe-pessoa.dto';
import type { ListPessoaReducedDto } from '@back/pessoa/dto/list-pessoa.dto';
import type {
  BuscaResponsabilidades,
  DetalheResponsabilidadeDto,
  ExecutaTransferenciaResponsabilidades,
} from '@back/pessoa/dto/responsabilidade-pessoa.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Meta = DetalheResponsabilidadeDto['metas'][number];
type Plano = ListPdmDto['linhas'][number];
type PessoaSimplificada = ListPessoaReducedDto['linhas'][number];

interface ChamadasPendentes {
  metas: boolean;
  planos: boolean;
  pessoa: boolean;
  pessoas: boolean;
  execucao: boolean;
}

interface Erros {
  metas: unknown;
  planos: unknown;
  pessoa: unknown;
  pessoas: unknown;
  execucao: unknown;
}

interface Estado {
  metas: Meta[];
  planos: Plano[];
  pessoasPorId: Record<number, DetalhePessoaDto>;
  pessoas: PessoaSimplificada[];
  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
}

export const useResponsabilidadesDePessoaStore = defineStore('responsabilidadesDePessoa', {
  state: (): Estado => ({
    metas: [],
    planos: [],
    pessoasPorId: {},
    pessoas: [],
    chamadasPendentes: {
      metas: false,
      planos: false,
      pessoa: false,
      pessoas: false,
      execucao: false,
    },
    erros: {
      metas: null,
      planos: null,
      pessoa: null,
      pessoas: null,
      execucao: null,
    },
  }),

  actions: {
    async buscarMetas(params: BuscaResponsabilidades): Promise<void> {
      this.chamadasPendentes.metas = true;
      this.erros.metas = null;

      try {
        const { metas } = await this.requestS.get(
          `${baseUrl}/pessoa/responsabilidades`,
          { ...params },
        ) as DetalheResponsabilidadeDto;

        this.metas = metas;
      } catch (erro) {
        this.metas = [];
        this.erros.metas = erro;
      } finally {
        this.chamadasPendentes.metas = false;
      }
    },

    async buscarPlanos(): Promise<void> {
      this.chamadasPendentes.planos = true;
      this.erros.planos = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/pdm`) as ListPdmDto;
        this.planos = linhas;
      } catch (erro) {
        this.erros.planos = erro;
      } finally {
        this.chamadasPendentes.planos = false;
      }
    },

    async buscarPessoa(id: number): Promise<DetalhePessoaDto | null> {
      this.chamadasPendentes.pessoa = true;
      this.erros.pessoa = null;

      try {
        const pessoa = await this.requestS.get(`${baseUrl}/pessoa/${id}`) as DetalhePessoaDto;
        this.pessoasPorId[id] = pessoa;
        return pessoa;
      } catch (erro) {
        this.erros.pessoa = erro;
        return null;
      } finally {
        this.chamadasPendentes.pessoa = false;
      }
    },

    async buscarPessoas(): Promise<void> {
      this.chamadasPendentes.pessoas = true;
      this.erros.pessoas = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/pessoa/reduzido`) as ListPessoaReducedDto;
        this.pessoas = linhas;
      } catch (erro) {
        this.erros.pessoas = erro;
      } finally {
        this.chamadasPendentes.pessoas = false;
      }
    },

    async executar(carga: ExecutaTransferenciaResponsabilidades): Promise<boolean> {
      this.chamadasPendentes.execucao = true;
      this.erros.execucao = null;

      try {
        await this.requestS.post(`${baseUrl}/pessoa/responsabilidades`, { ...carga });
        return true;
      } catch (erro) {
        this.erros.execucao = erro;
        return false;
      } finally {
        this.chamadasPendentes.execucao = false;
      }
    },
  },
});
