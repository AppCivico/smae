import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { CreateRelDemandasDto } from './dto/create-demandas.dto';
import { DemandasService } from './demandas.service';
import { DemandasRelatorioDto } from './entities/demandas.entity';

@ApiTags('Relatórios - API')
@Controller('relatorio/demandas')
export class DemandasController {
    constructor(private readonly demandasService: DemandasService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.CasaCivil'])
    async create(@Body() dto: CreateRelDemandasDto, @CurrentUser() user: PessoaFromJwt): Promise<DemandasRelatorioDto> {
        return await this.demandasService.asJSON(dto, user);
    }
}
