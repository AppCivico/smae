export class ProjetoRiscoCalcResults {
    nivel: number
    grau_valor: number
    grau_descricao: string
    resposta_valor: number
    resposta_descricao: string
    impacto_descricao: string
    probabilidade_descricao: string
}

const probabilidadeDescricao = ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta/Fato'];
const impactoDescricao = ['Muito baixo', 'Baixo', 'Médio', 'Alto', 'Muito alto'];
const grauDescricao = ['Muito baixo', 'Baixo', 'Médio', 'Alto', 'Muito alto'];
const respostaDescricao = ['Aceitar', 'Mitigar', 'Mitigar', 'Eliminar', 'Transferir'];

export class RiscoCalc {
    static getResult(probabilidade: number, impacto: number) {
        const impacto_descricao: string = impactoDescricao[impacto - 1];
        const probabilidade_descricao: string = probabilidadeDescricao[probabilidade - 1];

        const nivel: number = probabilidade * impacto;

        let grau_valor: number;
        let grau_descricao: string;
        let resposta_valor: number;
        let resposta_descricao: string;

        if (nivel >= 1 && nivel < 4) {
            grau_valor = 1;
            grau_descricao = grauDescricao[0];

            resposta_valor = 1;
            resposta_descricao = respostaDescricao[0];
        } else if (nivel >= 4 && nivel < 9) {
            grau_valor = 2;
            grau_descricao = grauDescricao[1];

            resposta_valor = 2;
            resposta_descricao = respostaDescricao[1];
        } else if (nivel >= 9 && nivel < 16) {
            grau_valor = 3;
            grau_descricao = grauDescricao[2];

            resposta_valor = 2;
            resposta_descricao = respostaDescricao[2];
        } else if (nivel >= 16 && nivel < 20) {
            grau_valor = 4;
            grau_descricao = grauDescricao[3];

            resposta_valor = 4;
            resposta_descricao = respostaDescricao[3];
        } else if (nivel >= 20) {
            grau_valor = 5;
            grau_descricao = grauDescricao[4];

            resposta_valor = 5;
            resposta_descricao = respostaDescricao[4];
        } else {
            throw new Error('Faltando tratamento para valor do nivel');
        }

        return {
            nivel,
            grau_valor,
            grau_descricao,
            resposta_valor,
            resposta_descricao,
            impacto_descricao,
            probabilidade_descricao
        }
    }
}

export {
    grauDescricao,
    probabilidadeDescricao,
    respostaDescricao,
    impactoDescricao,
}
