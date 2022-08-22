import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { CargoService } from './cargo.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';

@ApiTags('cargo')
@Controller('cargo')
export class CargoController {
    constructor(private readonly cargoService: CargoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCargo.inserir')
    async create(@Body() createCargoDto: CreateCargoDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.cargoService.create(createCargoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll() {
        return await this.cargoService.findAll();
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCargo.editar')
    async update(@Param('id') id: string, @Body() updateCargoDto: UpdateCargoDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.cargoService.update(+id, updateCargoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCargo.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @CurrentUser() user: PessoaFromJwt) {
        await this.cargoService.remove(+id, user);
        return '';
    }
}
