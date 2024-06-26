import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateTipoDocumentoDto } from './dto/create-tipo-documento.dto';
import { ListTipoDocumentoDto } from './dto/list-tipo-documento.dto';
import { UpdateTipoDocumentoDto } from './dto/update-tipo-documento.dto';
import { TipoDocumentoService } from './tipo-documento.service';

@ApiTags('Tipo de Documento')
@Controller('tipo-documento')
export class TipoDocumentoController {
    constructor(private readonly tipoDocumentoService: TipoDocumentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoDocumento.inserir'])
    async create(
        @Body() createTipoDocumentoDto: CreateTipoDocumentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoDocumentoService.create(createTipoDocumentoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListTipoDocumentoDto> {
        return { linhas: await this.tipoDocumentoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoDocumento.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTipoDocumentoDto: UpdateTipoDocumentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoDocumentoService.update(+params.id, updateTipoDocumentoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoDocumento.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoDocumentoService.remove(+params.id, user);
        return '';
    }
}
