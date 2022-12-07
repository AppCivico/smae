import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { FindAnoParams } from '../common/decorators/find-params';
import { SofEntidadeService } from './sof-entidade.service';

@Controller('sof-entidade')
export class SofEntidadeController {
    constructor(private readonly sofEntidadeService: SofEntidadeService) { }

    @Get(':ano')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async findByYear(@Param() params: FindAnoParams,) {
        return await this.sofEntidadeService.findByYear(+params.ano);
    }

}
