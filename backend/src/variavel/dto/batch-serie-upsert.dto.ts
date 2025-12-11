import { Serie } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsNumberString, IsString, ValidateIf } from 'class-validator';

export class ExistingSerieJwt {
    periodo: string; // periodo
    id: number;
    variable_id: number; // variable_id
    serie: Serie;
}

export class NonExistingSerieJwt {
    periodo: string; // periodo
    variable_id: number; // variable_id
    serie: Serie;
}

export type SerieJwt = ExistingSerieJwt | NonExistingSerieJwt;

export class ValidatedUpsert {
    valor: string;

    /**
     * referencia do valor pra ser criado/atualizado
     * @example "token.nao-tao-grande.assim"
     * */
    @IsString()
    referencia: SerieJwt;
}

export class SerieUpsert {
    /**
     * valor pra ser salvo
     * @example "vazio or ou decimal como string '3.141567'"
     * */
    @IsNumberString({}, { message: 'Valor inválido. Use um número em formato de texto, como "100" ou "123,45"' })
    @ValidateIf((object, value) => value !== '')
    @Type(() => String)
    valor: string;

    /**
     * referencia do valor pra ser criado/atualizado
     * @example "token.nao-tao-grande.assim"
     * */
    @IsString()
    referencia: string;
}

export class BatchSerieUpsert {
    @IsArray({ message: 'Precisa ser um array' })
    valores: SerieUpsert[];
}
