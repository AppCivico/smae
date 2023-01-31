import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { UpdateEtapaDto } from './dto/update-etapa.dto';
import { EtapaService } from './etapa.service';

@ApiTags('Etapa')
@Controller('etapa')
export class EtapaController {
    constructor(private readonly etapaService: EtapaService) {}

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCronograma.editar', 'CadastroMeta.inserir')
    async update(@Param() params: FindOneParams, @Body() updateEtapaDto: UpdateEtapaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.etapaService.update(+params.id, updateEtapaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @Roles('CadastroCronograma.editar', 'CadastroMeta.inserir')
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.etapaService.remove(+params.id, user);
        return '';
    }
}
