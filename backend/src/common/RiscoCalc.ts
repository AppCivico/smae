export class ProjetoRiscoCalcResults {
    nivel: number
    grau_valor: number
    grau_descricao: string
    resposta_valor: number
    resposta_descricao: string
}

export class RiscoCalc {
    static getResult(probabilidade: number, impacto: number) {
        const nivel: number = probabilidade * impacto;

        let grau_valor: number;
        let grau_descricao: string;
        let resposta_valor: number;
        let resposta_descricao: string;

        if (nivel >= 1 && nivel < 4) {
            grau_valor = 1;
            grau_descricao = 'Muito baixo';
            
            resposta_valor = 1;
            resposta_descricao = 'Aceitar';
        } else if (nivel >= 4 && nivel < 9) {
            grau_valor = 2;
            grau_descricao = 'Baixo'
            
            resposta_valor = 2;
            resposta_descricao = 'Mitigar';
        } else if (nivel >= 9 && nivel < 16) {
            grau_valor = 3;
            grau_descricao = 'Médio';
            
            resposta_valor = 2;
            resposta_descricao = 'Mitigar';
        } else if (nivel >= 16 && nivel < 20) {
            grau_valor = 4;
            grau_descricao = 'Alto';
            
            resposta_valor = 4;
            resposta_descricao = 'Eliminar';
        } else if (nivel >= 20) {
            grau_valor = 5;
            grau_descricao = 'Muito alto';
            
            resposta_valor = 5;
            resposta_descricao = 'Transferir';
        } else {
            throw new Error('Faltando tratamento para valor do nivel');
        }

        return {
            nivel,
            grau_valor,
            grau_descricao,
            resposta_valor,
            resposta_descricao,
        }
    }
}