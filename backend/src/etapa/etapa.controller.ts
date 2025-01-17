import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { API_TAGS_CRONOGRAMA } from '../cronograma/cronograma.controller';
import { MetaController, MetaSetorialController } from '../meta/meta.controller';
import { UpdateEtapaDto } from './dto/update-etapa.dto';
import { EtapaService } from './etapa.service';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';

@ApiTags(API_TAGS_CRONOGRAMA)
@Controller('etapa')
export class EtapaController {
    private tipo: TipoPdm = 'PDM';
    constructor(private readonly etapaService: EtapaService) {}

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateEtapaDto: UpdateEtapaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.etapaService.update(this.tipo, +params.id, updateEtapaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiNoContentResponse()
    @Roles(MetaController.WritePerm)
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.etapaService.remove(this.tipo, +params.id, user);
        return '';
    }
}

@ApiTags(API_TAGS_CRONOGRAMA)
@Controller('plano-setorial-etapa')
export class EtapaPSController {
    constructor(private readonly etapaService: EtapaService) {}

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateEtapaDto: UpdateEtapaDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ) {
        return await this.etapaService.update(tipo, +params.id, updateEtapaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiNoContentResponse()
    @Roles(MetaSetorialController.WritePerm)
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt, @TipoPDM() tipo: TipoPdmType) {
        await this.etapaService.remove(tipo, +params.id, user);
        return '';
    }
}
