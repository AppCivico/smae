import { Prisma, Serie } from "@prisma/client";

export class SerieIndicadorDto {
    regiao_id: number | null;
    data_valor: string;
    valor_nominal: number;
    serie: Serie;
}

export class ListSerieIndicadorDto {
    linhas: SerieIndicadorDto[]
}
