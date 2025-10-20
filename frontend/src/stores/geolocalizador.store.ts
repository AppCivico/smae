import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ChamadasPendentes = {
  buscandoEndereco: boolean;
};

export type PontoEndereco = {
  camadas: {
    codigo: string;
    cor: null;
    descricao: string;
    id: number;
    nivel_regionalizacao: number;
    titulo: string;
  }[];
  endereco: {
    bbox: number[];
    geometry: {
      coordinates: [number, number];
      type: 'Point';
    };
    geometry_name: unknown;
    properties: {
      bairro: string;
      cep: string;
      cidade: string;
      codigo_pais: string;
      estado: string;
      numero: null;
      osm_type: string;
      pais: string;
      rua: string;
      string_endereco: string;
    };
    type: 'Feature';
  };
};

type Estado = {
  selecionado: any;
  enderecos: any[];
  erro: ChamadasPendentes;
  chamadasPendentes: ChamadasPendentes;
};

const chamadasPendentesPadrao: ChamadasPendentes = {
  buscandoEndereco: false,
};

export const useGeolocalizadorStore = defineStore('geolocalizador', {
  state: (): Estado => ({
    selecionado: {},
    enderecos: [],
    erro: { ...chamadasPendentesPadrao },
    chamadasPendentes: { ...chamadasPendentesPadrao },
  }),
  actions: {
    async buscarPorEndereco(termo: string) {
      try {
        this.erro.buscandoEndereco = false;
        this.chamadasPendentes.buscandoEndereco = true;

        const { linhas } = await this.requestS.post(`${baseUrl}/geolocalizar`, {
          tipo: 'Endereco',
          busca_endereco: termo,
        });

        this.enderecos = linhas ?? [];
      } catch (erro) {
        this.erro.buscandoEndereco = true;

        throw erro;
      } finally {
        this.chamadasPendentes.buscandoEndereco = false;
      }
    },
    async buscarPorCoordenadas(lat: number, long: number) {
      try {
        this.erro.buscandoEndereco = false;
        this.chamadasPendentes.buscandoEndereco = true;

        const { linhas } = await this.requestS.post(
          `${baseUrl}/geolocalizar-reverso`,
          {
            tipo: 'Endereco',
            lat,
            long,
          },
        );

        this.enderecos = linhas;
      } catch (erro) {
        this.erro.buscandoEndereco = true;

        throw erro;
      } finally {
        this.chamadasPendentes.buscandoEndereco = false;
      }
    },
    selecionarEndereco(endereco) {
      this.selecionado = endereco;
    },
  },
});
