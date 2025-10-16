import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { VinculoService } from './vinculo.service';
import { CreateVinculoDto } from './dto/create-vinculo.dto';

@ApiTags('Vinculo')
@Controller('distribuicao-recurso-vinculo')
export class VinculoController {
    constructor(private readonly vinculoService: VinculoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroVinculo.inserir'])
    async create(@Body() dto: CreateVinculoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.vinculoService.upsert(dto, user);
    }
}
