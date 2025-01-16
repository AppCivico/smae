import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaController, MetaSetorialController } from '../meta/meta.controller';
import { AtividadeService } from './atividade.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { FilterAtividadeDto } from './dto/filter-atividade.dto';
import { ListAtividadeDto } from './dto/list-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { AtividadeDto } from './entities/atividade.entity';

@ApiTags('Atividade')
@Controller('atividade')
export class AtividadeController {
    private tipoPdm: TipoPdm = 'PDM';
    constructor(private readonly atividadeService: AtividadeService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async create(
        @Body() createAtividadeDto: CreateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.atividadeService.create(this.tipoPdm, createAtividadeDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaController.ReadPerm)
    async findAll(@Query() filters: FilterAtividadeDto, @CurrentUser() user: PessoaFromJwt): Promise<ListAtividadeDto> {
        return { linhas: await this.atividadeService.findAll(this.tipoPdm, filters, user) };
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get(':id')
    @Roles(MetaController.ReadPerm)
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<AtividadeDto> {
        const r = await this.atividadeService.findAll(this.tipoPdm, { id: params.id }, user);
        if (!r.length) throw new HttpException('Atividade não encontrada.', 404);
        return r[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateAtividadeDto: UpdateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.atividadeService.update(this.tipoPdm, +params.id, updateAtividadeDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.atividadeService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

@ApiTags('Atividade')
@Controller('plano-setorial-atividade')
export class AtividadeSetorialController {
    private tipoPdm: TipoPdm = 'PS';
    constructor(private readonly atividadeService: AtividadeService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async create(
        @Body() createAtividadeDto: CreateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.atividadeService.create(this.tipoPdm, createAtividadeDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaSetorialController.ReadPerm)
    async findAll(@Query() filters: FilterAtividadeDto, @CurrentUser() user: PessoaFromJwt): Promise<ListAtividadeDto> {
        return { linhas: await this.atividadeService.findAll(this.tipoPdm, filters, user) };
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get(':id')
    @Roles(MetaSetorialController.ReadPerm)
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<AtividadeDto> {
        const r = await this.atividadeService.findAll(this.tipoPdm, { id: params.id }, user);
        if (!r.length) throw new HttpException('Atividade não encontrada.', 404);
        return r[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateAtividadeDto: UpdateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.atividadeService.update(this.tipoPdm, +params.id, updateAtividadeDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.atividadeService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}
