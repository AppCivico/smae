import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { UpdateEtapaDto } from './dto/update-etapa.dto';
import { EtapaService } from './etapa.service';

@ApiTags('Etapa')
@Controller('etapa')
export class EtapaController {
    constructor(private readonly etapaService: EtapaService) { }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroEtapa.editar')
    async update(@Param() params: FindOneParams, @Body() updateEtapaDto: UpdateEtapaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.etapaService.update(+params.id, updateEtapaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroEtapa.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.etapaService.remove(+params.id, user);
        return '';
    }

}
