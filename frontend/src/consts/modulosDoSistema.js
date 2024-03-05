import gestaoDeProjetos from '@/assets/modulos/gestao-de-projetos.svg';
import planosSetoriais from '@/assets/modulos/planos-setoriais.svg';
import programaDeMetas from '@/assets/modulos/programa-de-metas.svg';
import transferenciasVoluntarias from '@/assets/modulos/transferencias-voluntarias.svg';

export default {
  PDM: {
    nome: 'Programa de metas',
    valor: 'PDM',
    ícone: programaDeMetas,
    rotaInicial: {
      name: 'panorama',
    },
  },
  Projetos: {
    nome: 'Gestão de projetos',
    valor: 'Projetos',
    ícone: transferenciasVoluntarias,
    rotaInicial: {
      name: 'projetosListar',
    },
  },
  CasaCivil: {
    nome: 'Transferências voluntárias',
    valor: 'CasaCivil',
    ícone: gestaoDeProjetos,
    rotaInicial: {
      name: 'parlamentaresListar',
    },
  },
  PlanoSetorial: {
    nome: 'Planos setoriais',
    valor: 'planos_setoriais',
    ícone: planosSetoriais,
    rotaInicial: null,
    desabilitado: true,
  },
};
