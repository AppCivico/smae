import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SyncCadastroBasicoService } from './sync-cadastro-basico.service';
import { SyncCadastroBasicoRequestDto, SyncCadastroBasicoRespostaDto } from './dto/sync-cadastro-basico.dto';

@ApiTags('Sincronização de Cadastro Básico')
@Controller('sync-cadastro-basico')
export class SyncCadastroBasicoController {
    constructor(private readonly syncCadastroBasicoService: SyncCadastroBasicoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        type: SyncCadastroBasicoRespostaDto,
        description: 'Retorna todos cadastros básicos solicitados com controle de versão por tipo',
    })
    async syncCadastrosBasicos(
        @Body() syncRequest: SyncCadastroBasicoRequestDto
    ): Promise<SyncCadastroBasicoRespostaDto> {
        return await this.syncCadastroBasicoService.sync(syncRequest);
    }
}
