import gestaoDeProjetos from '@/assets/modulos/gestao-de-projetos.svg';
import monitoramentoDeObras from '@/assets/modulos/monitoramento-de-obras.svg';
import planosSetoriais from '@/assets/modulos/planos-setoriais.svg';
import programaDeMetas from '@/assets/modulos/programa-de-metas.svg';
import transferenciasVoluntarias from '@/assets/modulos/transferencias-voluntarias.svg';

export default {
  PDM: {
    nome: 'Programa de metas',
    ícone: programaDeMetas,
    rotaInicial: {
      name: 'panorama',
    },
  },
  Projetos: {
    nome: 'Gestão de projetos',
    ícone: gestaoDeProjetos,
    rotaInicial: {
      name: 'projetosListar',
    },
  },
  CasaCivil: {
    nome: 'Transferências voluntárias',
    ícone: transferenciasVoluntarias,
    rotaInicial: {
      name: 'PanoramaTransferenciasListar',
    },
  },
  MDO: {
    nome: 'Monitoramento de Obras',
    ícone: monitoramentoDeObras,
    rotaInicial: {
      name: 'cadastrosBasicos',
    },
  },
  PlanoSetorial: {
    nome: 'Planos setoriais',
    ícone: planosSetoriais,
    rotaInicial: {
      name: 'planosSetoriaisListar',
    },
  },
};
