import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { MinhaContaDao } from 'src/minha-conta/models/minha-conta.dto';

@ApiTags('minha-conta')
@Controller('minha-conta')
export class MinhaContaController {

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    getMe(@CurrentUser() user: PessoaFromJwt): MinhaContaDao {
        return { 'sessao': user };
    }
}
