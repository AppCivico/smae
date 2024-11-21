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
};

export type ModulosDoSistema = {
  PDM: Modulo;
  Projetos: Modulo;
  CasaCivil: Modulo;
  MDO: Modulo;
  PlanoSetorial: Modulo;
};

export default {
  PDM: {
    nome: 'Programa de metas',
    ícone: programaDeMetas,
    rotaInicial: [
      {
        name: 'panorama',
      },
    ],
  },
  Projetos: {
    nome: 'Gestão de projetos',
    ícone: gestaoDeProjetos,
    rotaInicial: [
      {
        name: 'painelEstrategico',
      },
    ],
  },
  CasaCivil: {
    nome: 'Transferências voluntárias',
    ícone: transferenciasVoluntarias,
    rotaInicial: [
      {
        name: 'PanoramaTransferenciasListar',
      },
    ],
  },
  MDO: {
    nome: 'Monitoramento de Obras',
    ícone: monitoramentoDeObras,
    rotaInicial: [
      {
        name: 'obrasListar',
      },
    ],
  },
  PlanoSetorial: {
    nome: 'Planos setoriais',
    ícone: planosSetoriais,
    rotaInicial: [
      {
        name: 'planosSetoriaisListar',
      },
    ],
  },
};
