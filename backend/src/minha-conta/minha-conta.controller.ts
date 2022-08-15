import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';

@ApiTags('minha-conta')
@Controller('minha-conta')
export class MinhaContaController {

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    getMe(@CurrentUser() user: PessoaFromJwt): PessoaFromJwt {
        return user;
    }
}
