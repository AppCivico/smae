import { ApiProperty } from '@nestjs/swagger';
import { Serie } from 'src/generated/prisma/client';
import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';
import { RegiaoBasica as RegiaoDto } from '../../../regiao/entities/regiao.entity';

export class RelIndicadoresDto {
    indicador: IdCodTituloDto;
    meta: IdCodTituloDto | null;
    iniciativa: IdCodTituloDto | null;
    atividade: IdCodTituloDto | null;
    meta_tags: RelTag[] | null;

    @ApiProperty({ enum: Serie, enumName: 'Serie' })
    serie: string;
    /**
     * data em YYYY-MM (anual, analítico), YYYY (anual, consolidado) ou "YYYY-MM/YYYY-MM" (semestral, consolidado e analítico)
     **/
    data: string;

    data_referencia: string;
    /**
     * Valor inteiro ou null
     **/
    valor: string | null;
}

export class RelIndicadoresVariaveisDto extends RelIndicadoresDto {
    variavel?: IdCodTituloDto;
    regiao_nivel_4: RegiaoDto | null;
    regiao_nivel_3: RegiaoDto | null;
    regiao_nivel_2: RegiaoDto | null;
    regiao_nivel_1: RegiaoDto | null;
    regiao_id: number;
    valor_categorica: string | null;
}

export class ListIndicadoresDto {
    linhas: RelIndicadoresDto[];
    regioes: RelIndicadoresVariaveisDto[];
}

export class RelTag {
    id: number;
    descricao: string;
    ods_id: number | null;
}
