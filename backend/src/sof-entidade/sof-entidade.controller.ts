import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { FindAnoParams } from '../common/decorators/find-params';
import { SofEntidadeDto } from './entities/sof-entidade.entity';
import { SofEntidadeService } from './sof-entidade.service';

@Controller('sof-entidade')
export class SofEntidadeController {
    constructor(private readonly sofEntidadeService: SofEntidadeService) { }

    @Get(':ano')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Header('Cache-Control', 'max-age=3600')
    @ApiOperation({ summary: 'Dados do ano corrente são atualizados diariamente, resposta pode ser salva em storage local por ate 24h' })
    async findByYear(@Param() params: FindAnoParams): Promise<SofEntidadeDto> {
        return (await this.sofEntidadeService.findByYear(+params.ano)) as any as SofEntidadeDto;
    }

}
