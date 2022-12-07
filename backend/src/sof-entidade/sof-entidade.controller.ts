import { Controller, Get, Param } from '@nestjs/common';
import { FindAnoParams } from '../common/decorators/find-params';
import { SofEntidadeService } from './sof-entidade.service';

@Controller('sof-entidade')
export class SofEntidadeController {
    constructor(private readonly sofEntidadeService: SofEntidadeService) { }

    @Get(':ano')
    findByYear(@Param() params: FindAnoParams,) {
        return this.sofEntidadeService.findByYear(+params.ano);
    }

}
