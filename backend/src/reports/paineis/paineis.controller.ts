import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateRelPaineisDto } from './dto/create-paineis.dto';
import { ListRelPaineisDto } from './entities/paineis.entity';
import { PaineisService } from './paineis.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/paineis')
export class PaineisController {
    constructor(private readonly paineisService: PaineisService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar')
    async create(@Body() dto: CreateRelPaineisDto): Promise<ListRelPaineisDto> {
        return await this.paineisService.create(dto);
    }
}
