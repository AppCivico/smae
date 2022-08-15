import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';

@ApiTags('minha-conta')
@Controller('minha-conta')
export class MinhaContaController {

    @Get()
    getMe(@CurrentUser() user: Pessoa): Pessoa {
        return user;
    }
}
