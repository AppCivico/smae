import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CreateRelObrasDto } from './dto/create-obras.dto';
import { PPObrasRelatorioDto } from './entities/obras.entity';
import { PPObrasService } from './pp-obras.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/obras')
export class PPObrasController {
    constructor(private readonly obras: PPObrasService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.MDO'])
    async create(
        @Body() createObrasDto: CreateRelObrasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PPObrasRelatorioDto> {
        return await this.obras.asJSON(createObrasDto, user);
    }
}
