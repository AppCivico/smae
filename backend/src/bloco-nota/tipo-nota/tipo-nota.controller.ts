import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';

import { TipoNotaService } from './tipo-nota.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateTipoNotaDto, FilterTipoNota, ListTipoNotaDto, UpdateTipoNotaDto } from './dto/tipo-nota.dto';

@ApiTags('Bloco Nota / Tipo')
@Controller('tipo-nota')
export class TipoNotaController {
    constructor(private readonly tipoNotaService: TipoNotaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async create(@Body() createTagDto: CreateTipoNotaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.tipoNotaService.create(createTagDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterTipoNota): Promise<ListTipoNotaDto> {
        return { linhas: await this.tipoNotaService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTagDto: UpdateTipoNotaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoNotaService.update(+params.id, updateTagDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoNotaService.remove(+params.id, user);
        return '';
    }
}
