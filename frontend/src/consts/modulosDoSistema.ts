import gestaoDeProjetos from '@/assets/modulos/gestao-de-projetos.svg';
import monitoramentoDeObras from '@/assets/modulos/monitoramento-de-obras.svg';
import planosSetoriais from '@/assets/modulos/planos-setoriais.svg';
import programaDeMetas from '@/assets/modulos/programa-de-metas.svg';
import transferenciasVoluntarias from '@/assets/modulos/transferencias-voluntarias.svg';

export type RotaInicial = {
  name: string;
};

export type Modulo = {
  nome: string;
  ícone: string;
  rotaInicial: RotaInicial | RotaInicial[];
  possiveisEntidadesMae: string | string[];
};

export enum ModuloSistema {
  SMAE = 'SMAE',
  PDM = 'PDM',
  CasaCivil = 'CasaCivil',
  Projetos = 'Projetos',
  PlanoSetorial = 'PlanoSetorial',
  MDO = 'MDO',
  ProgramaDeMetas = 'ProgramaDeMetas',
}

export type ModulosDoSistema = {
  [key in ModuloSistema]?: Modulo;
};

const modulos: ModulosDoSistema = {
  PDM: {
    nome: 'OLD - Programa de metas',
    possiveisEntidadesMae: [
      'pdm',
    ],
    ícone: programaDeMetas,
    rotaInicial: [
      {
        name: 'panorama',
      },
      {
        name: 'pdm.metas',
      },
    ],
  },
  ProgramaDeMetas: {
    nome: 'Programa de metas',
    possiveisEntidadesMae: [
      'programaDeMetas',
    ],
    ícone: programaDeMetas,
    rotaInicial: [
      {
        name: 'programaDeMetas.quadroDeAtividades',
      },
      {
        name: 'programaDeMetas.metasDoProgramaCorrente',
      },
    ],
  },
  Projetos: {
    nome: 'Gestão de projetos',
    possiveisEntidadesMae: [
      'projeto',
      'portfolio',
    ],
    ícone: gestaoDeProjetos,
    rotaInicial: [
      {
        name: 'painelEstrategico',
      },
    ],
  },
  CasaCivil: {
    nome: 'Transferências voluntárias',
    possiveisEntidadesMae: [
      'TransferenciasVoluntarias',
    ],
    ícone: transferenciasVoluntarias,
    rotaInicial: [
      {
        name: 'PanoramaTransferenciasListar',
      },
    ],
  },
  MDO: {
    nome: 'Monitoramento de Obras',
    possiveisEntidadesMae: [
      'mdo',
      'obras',
    ],
    ícone: monitoramentoDeObras,
    rotaInicial: [
      {
        name: 'obrasListar',
      },
    ],
  },
  PlanoSetorial: {
    nome: 'Planos setoriais',
    possiveisEntidadesMae: [
      'planoSetorial',
    ],
    ícone: planosSetoriais,
    rotaInicial: [
      {
        name: 'planoSetorial.quadroDeAtividades',
      },
      {
        name: 'planoSetorial.planosSetoriaisListar',
      },
    ],
  },
};

export default modulos;
