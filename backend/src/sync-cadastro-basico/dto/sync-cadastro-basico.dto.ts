import { ApiProperty } from '@nestjs/swagger';
import { OrgaoDto } from 'src/orgao/entities/orgao.entity';
import { UnidadeMedida } from 'src/unidade-medida/entities/unidade-medida.entity';
import { FonteVariavelDto } from 'src/fonte-variavel/dto/fonte-variavel.dto';
import { AssuntoVariavelDto } from 'src/assunto-variavel/dto/assunto-variavel.dto';
import { ListVariavelCategoricaDto } from 'src/variavel-categorica/dto/variavel-categorica.dto';
import { ObjetivoEstrategicoDto } from 'src/tema/entities/objetivo-estrategico.entity';
import { MacroTemaDto } from 'src/macro-tema/entities/macro-tema.entity';
import { SubTemaDto } from 'src/subtema/entities/subtema.entity';
import { OdsDto } from 'src/ods/entities/ods.entity';
import { TagDto } from 'src/tag/entities/tag.entity';
import { ProjetoTagDto } from 'src/pp/projeto-tag/entities/tag.entity';
// import { ProjetoTagMDO }
import { ListTipoAditivoDto } from 'src/tipo-aditivo/dto/tipo-aditivo.dto';
import { TipoIntervencao } from 'src/pp/tipo-intervencao/entities/tipo-intervencao.entity';
import { Regiao } from 'src/regiao/entities/regiao.entity';

type SyncCadastroBasicoTipo =
    | OrgaoDto
    | UnidadeMedida
    | FonteVariavelDto
    | AssuntoVariavelDto
    | ListVariavelCategoricaDto
    | ObjetivoEstrategicoDto
    | MacroTemaDto
    | SubTemaDto
    | OdsDto
    | TagDto
    | ProjetoTagDto
    | ListTipoAditivoDto
    | TipoIntervencao
    | Regiao;

export class SyncCadastroBasicoDto {
    @ApiProperty({ description: 'Tipo do cadastro básico', example: 'orgao' })
    tipo: string;

    @ApiProperty({ description: 'Versão do schema', example: '2024.0.1' })
    versao: string;

    @ApiProperty({ description: 'Lista de registros do tipo informado' })
    linhas: SyncCadastroBasicoTipo[];
}

export class SyncResponseDto {
    @ApiProperty({ description: 'Dados sincronizados' })
    dados: SyncCadastroBasicoDto[];

    @ApiProperty({
        description: 'Se true, indica que o schema foi alterado e o frontend precisa baixar tudo novamente',
        example: false,
    })
    schema_desatualizado: boolean;

    @ApiProperty({ description: 'IDs de registros que foram removidos' })
    removidos: { tipo: string; ids: number[] }[];
}
