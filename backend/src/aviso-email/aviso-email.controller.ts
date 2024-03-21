import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { AvisoEmailService } from './aviso-email.service';
import { CreateAvisoEmailDto } from './dto/create-aviso-email.dto';
import { UpdateAvisoEmailDto } from './dto/update-aviso-email.dto';
import { FilterAvisoEamilDto, ListAvisoEmailDto } from './entities/aviso-email.entity';

//const roles: ListaDePrivilegios[] = [];

@ApiTags('Avisos por emails')
@Controller('aviso-email')
export class AvisoEmailController {
    constructor(private readonly avisoEmailService: AvisoEmailService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    //    @Roles(...roles)
    async create(@Body() dto: CreateAvisoEmailDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.avisoEmailService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    //@Roles(...roles)
    async findAll(
        @Query() filter: FilterAvisoEamilDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListAvisoEmailDto> {
        return { linhas: await this.avisoEmailService.findAll(filter, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    //@Roles(...roles)
    async update(
        @Param() id: FindOneParams,
        @Body() dto: UpdateAvisoEmailDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.avisoEmailService.update(id.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    //@Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() id: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.avisoEmailService.remove(id.id, user);

        return '';
    }
}
