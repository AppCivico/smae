
import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SyncCadastroBasicoService } from './sync-cadastro-basico.service';
import { SyncCadastroBasicoRespostaDto } from './dto/sync-cadastro-basico.dto';

@ApiTags('Sincronização de Cadastro Básico')
@Controller('sync-cadastro-basico')
export class SyncCadastroBasicoController {
    constructor(private readonly syncCadastroBasicoService: SyncCadastroBasicoService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ type: SyncCadastroBasicoRespostaDto, description: 'Retorna todos cadastros básicos' })
    @ApiQuery({
        name: 'atualizado_em',
        required: false,
        type: Number,
        description: 'Timestamp em segundos (epoch) para buscar registros alterados após essa data.',
    })
    @ApiQuery({
        name: 'tipos',
        required: false,
        type: String,
        description: 'Lista de tipos de cadastro básico separados por vírgula',
    })
    @ApiQuery({
        name: 'versao',
        required: false,
        type: String,
        description: 'Versão do schema',
    })
    async syncCadastrosBasicos(
        @Query('atualizado_em') atualizado_em: number,
        @Query('tipos') tipos: string,
        @Query('versao') versao: string
    ): Promise<SyncCadastroBasicoRespostaDto> {
        const tipoArray = tipos ? tipos.split(',') : [];
        return await this.syncCadastroBasicoService.sync({atualizado_em, tipos: tipoArray.join(','), versao});
    }
}
