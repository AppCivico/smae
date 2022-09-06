import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { MinhaContaDto } from 'src/minha-conta/models/minha-conta.dto';
import { CreatePessoaDto } from 'src/pessoa/dto/create-pessoa.dto';
import { PessoaService } from 'src/pessoa/pessoa.service';
import { NovaSenhaDto } from './models/nova-senha.dto';

@ApiTags('Minha Conta')
@Controller('')
export class MinhaContaController {
    constructor(private readonly pessoaService: PessoaService) { }

    @Get('minha-conta')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    getMe(@CurrentUser() user: PessoaFromJwt): MinhaContaDto {
        return { 'sessao': user };
    }

    @Post('trocar-senha')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePassword(@Body() novaSenhaDto: NovaSenhaDto, @CurrentUser() user: PessoaFromJwt) {
        await this.pessoaService.novaSenha(novaSenhaDto, user);
        return '';
    }
}
