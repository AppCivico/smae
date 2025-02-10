import createDataTree from '@/helpers/createDataTree.ts';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function filtrar(array, nome, id) {
  const conferirDescendentes = (resultado, item, index) => {
    switch (true) {
      // no código original, nome é mas importante do que ID
      case nome && item.descricao.toLowerCase().includes(nome):
      case id && item.id === id:
        resultado.push({ ...item, index });
        return resultado;
      case Array.isArray(item.children): {
        const children = item.children.reduce(conferirDescendentes, []);
        if (children.length) resultado.push({ ...item, index, children });
        return resultado;
      }
      default:
        return resultado;
    }
  };

  return array.reduce(conferirDescendentes, []);
}

export const useRegionsStore = defineStore({
  id: 'regions',
  state: () => ({
    listregions: [],
    regions: {},
    tempRegions: {},
    singleTempRegions: {},
    camadas: null,
    chamadasPendentes: {
      camadas: false,
    },
    erros: {
      camadas: null,
    },
  }),
  actions: {
    // PRA-FAZER: trocar essa função redundante por $reset()
    clear() {
      this.regions = {};
      this.tempRegions = {};
      this.singleTempRegions = {};
    },
    clearEdit() {
      this.singleTempRegions = {};
    },
    async getAll() {
      this.regions = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/regiao`);
        this.listregions = r.linhas;
        if (Array.isArray(r.linhas)) {
          this.regions = createDataTree(r.linhas, { parentPropertyName: 'parente_id' });
        } else {
          this.regions = r.linhas;
        }
      } catch (error) {
        this.regions = { error };
      }
    },
    async getById(id) {
      this.singleTempRegions = { loading: true };
      try {
        if (!this.listregions.length) {
          await this.getAll();
        }
        this.singleTempRegions = this.listregions.find((u) => u.id == id);
        if (!this.singleTempRegions) throw 'Item não encontrado';
      } catch (error) {
        this.singleTempRegions = { error };
      }
    },
    async insert(params) {
      const m = {
        nivel: Number(params.nivel),
        parente_id: params.parente_id ? Number(params.parente_id) : null,
        descricao: params.descricao,
      };
      if (params.upload_shapefile)m.upload_shapefile = params.upload_shapefile;
      if (await this.requestS.post(`${baseUrl}/regiao`, m)) {
        this.getAll();
        return true;
      }
      return false;
    },
    async update(id, params) {
      const m = {
        // nivel: Number(params.nivel),
        parente_id: params.parente_id ? Number(params.parente_id) : null,
        descricao: params.descricao,
      };
      if (params.upload_shapefile) {
        m.upload_shapefile = params.upload_shapefile;
      }

      try {
        await this.requestS.patch(`${baseUrl}/regiao/${id}`, m);

        // devido a inconsistências no envio, é mais seguro não usar a carga
        // da requisição para atualizar o objeto
        this.getAll();
        return true;
      } catch (error) {
        return false;
      }
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/regiao/${id}`)) {
        this.$patch({
          regions: this.regions.filter(function removerRegião(x) {
            if (x.id == id) {
              return false;
            }
            if (Array.isArray(x.children)) {
              // eslint-disable-next-line no-param-reassign
              x.children = x.children.filter(removerRegião);
            }
            return true;
          }),
        });

        return true;
      }
      return false;
    },
    async filterRegions(f) {
      if (!this.tempRegions.length) this.tempRegions = { loading: true };
      try {
        if (!this.regions.length) await this.getAll();

        if (f?.textualSearch || f?.id) {
          const nome = f.textualSearch ? f.textualSearch.toLowerCase() : undefined;
          const id = f.id ? f.id : undefined;

          this.tempRegions = filtrar(this.regions, nome, id);
        } else {
          this.tempRegions = JSON.parse(JSON.stringify(this.regions));
        }
      } catch (error) {
        this.tempRegions = { error };
      }
    },
    async buscarCamadas(params) {
      this.chamadasPendentes.camadas = true;
      this.erros.camadas = null;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/camada`, params);

        if (!this.camadas) {
          this.camadas = {};
        }

        if (!Array.isArray(linhas)) {
          throw new Error('resposta de `/camadas` fora do padrão esperado');
        } else {
          for (let i = 0; i < linhas.length; i += 1) {
            const camada = linhas[i];
            this.camadas[camada.id] = camada;
          }
        }
      } catch (error) {
        this.erros.camadas = error;
      } finally {
        this.chamadasPendentes.camadas = false;
      }
    },
  },
  getters: {
    regiõesPorNível: ({ listregions }) => listregions.reduce((acc, cur) => ({
      ...acc,
      [cur.nivel]: [
        ...(acc[cur.nivel] || []),
        cur,
      ],
    }), {}),

    regiõesPorId: ({ listregions }) => listregions.reduce((acc, cur) => {
      if (!acc[cur.id]) {
        acc[cur.id] = cur;
      }

      return acc;
    }, {}),

    regiõesPorNívelOrdenadas() {
      return Object.keys(this.regiõesPorNível)
        .reduce((acc, cur) => ({
          ...acc,
          [cur]: this.regiõesPorNível[cur]
            .sort((a, b) => a.descricao.localeCompare(b.descricao)),
        }), {});
    },

    regiõesPorMãe({ listregions }) {
      const agrupadas = listregions.reduce((acc, obj) => {
        const idDaMãe = obj.parente_id;
        if (!acc[idDaMãe]) {
          acc[idDaMãe] = [];
        }
        acc[idDaMãe].push(obj);
        return acc;
      }, {});

      Object.keys(agrupadas).forEach((idDaMãe) => {
        agrupadas[idDaMãe].sort((a, b) => a.descricao.localeCompare(b.descricao));
      });

      return agrupadas;
    },

  },
});
