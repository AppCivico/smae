import OportunidadesLista from '@/views/ps.oportunidades/OportunidadesLista.vue';
import OportunidadesRaiz from '@/views/ps.oportunidades/OportunidadesRaiz.vue';

export default {
  path: '/oportunidades',
  component: OportunidadesRaiz,
  meta: {
    título: 'Oportunidades',
    rotaPrescindeDeChave: true,
    presenteNoMenu: true,
    pesoNoMenu: 1,
    íconeParaMenu:
    '<svg width="24" height="22" viewBox="0 0 24 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg"> <path d="M15.1316 2.14719C14.4397 2.14719 13.7761 2.42984 13.2868 2.93296C12.7976 3.43609 12.5227 4.11847 12.5227 4.83C12.5227 5.54152 12.7976 6.22391 13.2868 6.72703C13.7761 7.23016 14.4397 7.51281 15.1316 7.51281C15.8235 7.51281 16.4871 7.23016 16.9764 6.72703C17.4656 6.22391 17.7405 5.54152 17.7405 4.83C17.7405 4.11847 17.4656 3.43609 16.9764 2.93296C16.4871 2.42984 15.8235 2.14719 15.1316 2.14719ZM10.4356 4.83C10.4354 4.00804 10.6393 3.19964 11.0279 2.48136C11.4165 1.76307 11.9769 1.15867 12.6562 0.725396C13.3354 0.292117 14.111 0.0442995 14.9094 0.00540906C15.7078 -0.0334814 16.5027 0.137843 17.2187 0.503158C17.9347 0.138278 18.7293 -0.0326991 19.5275 0.00640766C20.3256 0.0455145 21.1009 0.293412 21.7799 0.726639C22.4589 1.15987 23.0191 1.76409 23.4076 2.48214C23.7961 3.20018 24 4.0083 24 4.83C24 5.6517 23.7961 6.45981 23.4076 7.17786C23.0191 7.8959 22.4589 8.50013 21.7799 8.93336C21.1009 9.36659 20.3256 9.61448 19.5275 9.65359C18.7293 9.6927 17.9347 9.52172 17.2187 9.15684C16.5027 9.52215 15.7078 9.69348 14.9094 9.65459C14.111 9.6157 13.3354 9.36788 12.6562 8.9346C11.9769 8.50132 11.4165 7.89692 11.0279 7.17864C10.6393 6.46036 10.4354 5.65196 10.4356 4.83ZM19.0449 7.49993C19.1305 7.50852 19.2175 7.51281 19.3058 7.51281C19.6589 7.51203 20.0082 7.43753 20.3325 7.29384C20.6569 7.15014 20.9494 6.94024 21.1925 6.67685C21.4356 6.41346 21.6242 6.10206 21.7468 5.76152C21.8694 5.42098 21.9235 5.05839 21.9058 4.69571C21.8881 4.33303 21.799 3.97782 21.6439 3.6516C21.4888 3.32537 21.2709 3.03492 21.0034 2.79784C20.736 2.56077 20.4245 2.382 20.0878 2.27237C19.7512 2.16274 19.3964 2.12454 19.0449 2.16006C19.5555 2.95153 19.8277 3.88024 19.8276 4.83C19.8277 5.77976 19.5555 6.70847 19.0449 7.49993ZM8.80241 13.1467C8.63107 13.1463 8.46131 13.1805 8.30285 13.2475C8.14438 13.3146 8.00031 13.413 7.87886 13.5373L5.73957 15.7372V19.8538H11.6117L17.6674 18.2977L21.3533 16.6794C21.4788 16.6097 21.5749 16.4947 21.6231 16.3566C21.6713 16.2184 21.6681 16.0669 21.6143 15.9309C21.5605 15.795 21.4598 15.6843 21.3315 15.6201C21.2033 15.5558 21.0564 15.5425 20.9192 15.5827L20.8983 15.5881L14.207 17.1709H10.4356V15.0247H13.6967C13.9389 15.0247 14.1711 14.9258 14.3424 14.7497C14.5136 14.5736 14.6098 14.3347 14.6098 14.0857C14.6098 13.8367 14.5136 13.5978 14.3424 13.4217C14.1711 13.2456 13.9389 13.1467 13.6967 13.1467H8.80241ZM16.6834 14.383L20.3901 13.5062C20.7849 13.3995 21.1982 13.3872 21.5983 13.4703C21.9984 13.5534 22.3747 13.7297 22.6983 13.9856C23.0218 14.2415 23.2841 14.5703 23.4648 14.9467C23.6455 15.3231 23.74 15.7371 23.7409 16.1568C23.7405 16.6664 23.6023 17.1658 23.3417 17.5992C23.0811 18.0326 22.7085 18.383 22.2654 18.6111L22.2372 18.6261L18.3343 20.3377L11.8684 22H0V14.2198H4.26398L6.40536 12.0178C6.72087 11.6944 7.09522 11.4382 7.50705 11.2636C7.91887 11.0891 8.36011 10.9996 8.80554 11.0005H13.6967C14.1151 11.0004 14.5289 11.0904 14.9115 11.2645C15.2941 11.4387 15.637 11.6932 15.9183 12.0117C16.1996 12.3303 16.4129 12.7058 16.5447 13.1141C16.6764 13.5225 16.7237 13.9547 16.6834 14.383ZM3.65245 16.3661H2.08712V19.8538H3.65245V16.3661Z" fill="currentColor"/></svg>',
    limitarÀsPermissões: 'TransfereGov.listar',
    entidadeMãe: 'TransferenciasVoluntarias',
  },
  children: [
    {
      name: 'OportunidadesLista',
      path: '',
      component: OportunidadesLista,
      meta: {
        título: 'Oportunidades',
      },
    },
  ],
};
