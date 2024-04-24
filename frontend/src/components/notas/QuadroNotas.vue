<template>
  <div class="container">
    <p class="title center">
      NOTAS
    </p>
    <div
      v-for="(item, index) in dadosMockados"
      :key="index"
      class="flex center notas"
    >
      <div class="bullet" />
      <p class="identificador">
        {{ item.identificador }}
      </p>
      <div class="text">
        <p>{{ item.descricao }}</p>
        <p>
          <strong>{{ item.dataHora }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
// import { storeToRefs } from 'pinia';

// const blocoStore = useBlocoDeNotasStore();
// const {
//   lista: listaNotas,
//   erro,
//   chamadasPendentes,
// } = storeToRefs(blocoStore);
// blocoStore.buscarTudo('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJibG9jb19pZCI6NDYsImF1ZCI6ImJuIiwiaWF0IjoxNzE0MDAwOTQ1LCJleHAiOjE3MTY1OTI5NDV9.q8Pkjra1AZeVPNmEKnK9h0KtFOnXV7yyn4L5nSryHu4');

const dadosMockados = [
  {
    identificador: '21/2023',
    descricao: 'Complementar cadastro da transferência',
    dataHora: '12/01/2024 às 15:46',
  },
  {
    identificador: '22/2023',
    descricao: 'Revisão do contrato de compra',
    dataHora: '13/01/2024 às 10:00',
  },
  {
    identificador: '23/2023',
    descricao: 'Treinamento de novos funcionários',
    dataHora: '14/01/2024 às 09:30',
  },
  {
    identificador: '24/2023',
    descricao: 'Elaboração do relatório mensal',
    dataHora: '15/01/2024 às 14:00',
  },
  {
    identificador: '25/2023',
    descricao: 'Reunião com a equipe de vendas',
    dataHora: '16/01/2024 às 11:30',
  },
  {
    identificador: '26/2023',
    descricao: 'Atualização do sistema de estoque',
    dataHora: '17/01/2024 às 16:45',
  },
  {
    identificador: '27/2023',
    descricao: 'Entrega dos relatórios financeiros',
    dataHora: '18/01/2024 às 09:00',
  },
  {
    identificador: '28/2023',
    descricao: 'Análise dos resultados do trimestre',
    dataHora: '19/01/2024 às 13:15',
  },
  {
    identificador: '29/2023',
    descricao: 'Preparação para a reunião com investidores',
    dataHora: '20/01/2024 às 10:30',
  },
  {
    identificador: '30/2023',
    descricao: 'Desenvolvimento de novas funcionalidades do aplicativo',
    dataHora: '21/01/2024 às 14:20',
  },
  {
    identificador: '31/2023',
    descricao: 'Apresentação do projeto de expansão',
    dataHora: '22/01/2024 às 09:45',
  },
  {
    identificador: '01/2023',
    descricao: 'Auditoria interna',
    dataHora: '23/01/2024 às 11:00',
  },
  {
    identificador: '02/2023',
    descricao: 'Planejamento estratégico para o próximo ano',
    dataHora: '24/01/2024 às 15:30',
  },
  {
    identificador: '03/2023',
    descricao: 'Reunião com fornecedores',
    dataHora: '25/01/2024 às 10:15',
  },
  {
    identificador: '04/2023',
    descricao: 'Discussão sobre a política de teletrabalho',
    dataHora: '26/01/2024 às 09:00',
  },
];
</script>

<style scoped lang="less">
.container {
  padding: 15px 25px;
  border-radius: 10px;
  box-shadow: 0 8px 16px 0 #1527411a;
  width: 302px;
  min-width: 302px;
  height: auto !important;
}

.title {
  text-align: center;
  color: #3b5881;
  font-weight: 700;
  font-size: 13px;
}

.notas {
  padding-top: 20px;
  padding-left: 20px;
  border-left: 1px solid #607a9f;
  justify-content: space-between;
  position: relative;
}

.bullet {
  position: absolute;
  left: -4px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background-color: #607a9f;
  border-radius: 50%;
}

.identificador {
  border-radius: 50%;
  display: inline-block;
  line-height: 55px;
  width: 55px;
  height: 55px;
}

.notas:nth-child(3n + 1) .identificador {
  background-color: #e2eafe;
}

.notas:nth-child(3n + 2) .identificador {
  background-color: #f7f2fc;
}

.notas:nth-child(3n) .identificador {
  background-color: #fff4e9;
}

.text {
  text-align: right;
  font-size: 13px;
  margin-left: 10px;
}

.text p:first-child {
  max-width: 151px;
  max-height: 28px;
  margin-bottom: 5px;
  font-size: 11px;
}

p {
  margin-bottom: 0;
}
</style>
