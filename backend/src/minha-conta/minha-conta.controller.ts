import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { MinhaContaDto } from 'src/minha-conta/models/minha-conta.dto';

@ApiTags('Minha Conta')
@Controller('minha-conta')
export class MinhaContaController {

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    getMe(@CurrentUser() user: PessoaFromJwt): MinhaContaDto {
        try {
            console.log('x')
            if (global.gc) {
                 global.gc();
                 }
        } catch (e) {
            console.log("`node --expose-gc index.js`");
            process.exit();
        }

        return { 'sessao': user };
    }
}
