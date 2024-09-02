import ComunicadosGeraisLista from '@/views/comunicadosGerais/ComunicadosGeraisLista.vue';
import ComunicadosGeraisRaiz from '@/views/comunicadosGerais/ComunicadosGeraisRaiz.vue';

export default {
  path: '/comunicados-gerais',
  component: ComunicadosGeraisRaiz,
  meta: {
    título: 'Comunicados',
    rotaPrescindeDeChave: true,
    presenteNoMenu: true,
    pesoNoMenu: 1,
    íconeParaMenu:
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1 8.4241C1 7.84128 1.23153 7.28233 1.64364 6.87021C2.05576 6.45809 2.61472 6.22656 3.19754 6.22656H20.7779C21.3607 6.22656 21.9196 6.45809 22.3318 6.87021C22.7439 7.28233 22.9754 7.84128 22.9754 8.4241V20.5106C22.9754 21.0934 22.7439 21.6523 22.3318 22.0645C21.9196 22.4766 21.3607 22.7081 20.7779 22.7081H3.19754C2.61472 22.7081 2.05576 22.4766 1.64364 22.0645C1.23153 21.6523 1 21.0934 1 20.5106V8.4241ZM20.7779 8.4241H3.19754V20.5106H20.7779V8.4241Z" fill="#F7C234"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M7.31871 11.1715C7.31871 10.9529 7.40554 10.7433 7.56008 10.5888C7.71463 10.4342 7.92423 10.3474 8.14279 10.3474H15.8342C16.0527 10.3474 16.2623 10.4342 16.4169 10.5888C16.5714 10.7433 16.6583 10.9529 16.6583 11.1715C16.6583 11.39 16.5714 11.5996 16.4169 11.7542C16.2623 11.9087 16.0527 11.9956 15.8342 11.9956H8.14279C7.92423 11.9956 7.71463 11.9087 7.56008 11.7542C7.40554 11.5996 7.31871 11.39 7.31871 11.1715ZM6.21995 14.4678C6.21995 14.2492 6.30677 14.0396 6.46131 13.8851C6.61586 13.7305 6.82546 13.6437 7.04402 13.6437H16.933C17.1515 13.6437 17.3611 13.7305 17.5157 13.8851C17.6702 14.0396 17.757 14.2492 17.757 14.4678C17.757 14.6863 17.6702 14.8959 17.5157 15.0505C17.3611 15.205 17.1515 15.2919 16.933 15.2919H7.04402C6.82546 15.2919 6.61586 15.205 6.46131 15.0505C6.30677 14.8959 6.21995 14.6863 6.21995 14.4678ZM7.31871 17.7641C7.31871 17.5455 7.40554 17.3359 7.56008 17.1814C7.71463 17.0268 7.92423 16.94 8.14279 16.94H15.8342C16.0527 16.94 16.2623 17.0268 16.4169 17.1814C16.5714 17.3359 16.6583 17.5455 16.6583 17.7641C16.6583 17.9827 16.5714 18.1923 16.4169 18.3468C16.2623 18.5013 16.0527 18.5882 15.8342 18.5882H8.14279C7.92423 18.5882 7.71463 18.5013 7.56008 18.3468C7.40554 18.1923 7.31871 17.9827 7.31871 17.7641ZM13.5421 3.84048C13.13 3.42851 12.5712 3.19707 11.9885 3.19707C11.4058 3.19707 10.8469 3.42851 10.4348 3.84048L6.1727 8.10371C6.07061 8.20572 5.94943 8.28663 5.81608 8.34181C5.68272 8.397 5.5398 8.42537 5.39548 8.42532C5.25116 8.42527 5.10826 8.39679 4.97494 8.34152C4.84163 8.28624 4.7205 8.20525 4.61849 8.10316C4.51647 8.00107 4.43556 7.87989 4.38038 7.74654C4.3252 7.61318 4.29682 7.47026 4.29688 7.32594C4.29693 7.18162 4.3254 7.03872 4.38068 6.9054C4.43596 6.77209 4.51695 6.65096 4.61904 6.54895L8.88117 2.28682C9.70536 1.46287 10.8231 1 11.9885 1C13.1539 1 14.2716 1.46287 15.0958 2.28682L19.359 6.54895C19.5651 6.75512 19.6808 7.0347 19.6806 7.32617C19.6805 7.61764 19.5647 7.89713 19.3585 8.10316C19.1523 8.30919 18.8727 8.42487 18.5813 8.42477C18.2898 8.42467 18.0103 8.30878 17.8043 8.10261L13.5421 3.84048Z" fill="#F7C234"/> </svg>',
    limitarÀsPermissões: 'CadastroTransferencia.listar',
    prefixoParaFilhas: 'TransferenciasVoluntarias',
  },
  children: [
    {
      name: 'ComunicadosGeraisLista',
      path: '',
      component: ComunicadosGeraisLista,
      meta: {
        título: 'Comunicados Gerais',
      },
    },
  ],
};