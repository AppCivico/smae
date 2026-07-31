import {
  number, object, string,
} from './initSchema';

export default object().shape({
  ano: number()
    .label('Ano')
    .nullableOuVazio(),
  cancelada: string()
    .label('Considera canceladas')
    .nullableOuVazio(),
  esfera: string()
    .label('Esfera')
    .nullableOuVazio(),
  palavra_chave: string()
    .label('Palavra-chave')
    .nullableOuVazio()
    .meta({
      balaoInformativo: `Busca em
Transferência (esfera, interface, ano, gestor do contrato, secretaria concedente, emenda, nome do programa, objeto, demanda, plano de ação, observações, programa, tipo, sigla, sigla, nome popular, sigla, cargo, identificador, valor de repasse)
e Distribuição de Recursos(nome, objeto, sigla, descrição do órgão gestor, processo SEI).`,
    }),
  preenchimento_completo: string()
    .label('Apenas completas')
    .nullableOuVazio(),
});
