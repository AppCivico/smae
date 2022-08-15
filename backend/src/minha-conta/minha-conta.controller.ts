import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';

@Controller('minha-conta')
export class MinhaContaController {

    @Get()
    getMe(@CurrentUser() user: Pessoa): Pessoa {
        return user;
    }
}
