import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateRelIndicadorDto } from './dto/create-indicadore.dto';
import { ListIndicadoresDto } from './entities/indicadores.entity';
import { IndicadoresService } from './indicadores.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/indicadores')
export class IndicadoresController {
    constructor(private readonly indicadoresService: IndicadoresService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar')
    async create(@Body() dto: CreateRelIndicadorDto): Promise<ListIndicadoresDto> {
        return await this.indicadoresService.create(dto);
    }
}
