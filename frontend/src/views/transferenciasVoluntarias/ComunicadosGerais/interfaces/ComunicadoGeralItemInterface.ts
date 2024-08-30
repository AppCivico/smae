export type IComunicadoGeralItem = {
  id: number;
  titulo: string;
  conteudo: string;
  dados: {
    ano: number;
    link: string;
    numero: number;
    tipo: string;
    transfere_gov_id: number;
  };
  data: string | Date;
  lido: boolean;
};
