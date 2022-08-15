import {
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';
import { AuthService } from './auth.service';
import { IsPublic } from './decorators/is-public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthRequest } from './models/AuthRequest';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiTags('publico')
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @IsPublic()
    @UseGuards(LocalAuthGuard)
    async login(@Request() req: AuthRequest) {
        return this.authService.login(req.user);
    }

    @ApiTags('minha-conta')
    @Post('sair')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@CurrentUser() user: Pessoa) {
        await this.authService.logout(user);
        return ''
    }
}