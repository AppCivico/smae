import {
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiDefaultResponse, ApiExtraModels, ApiNoContentResponse, ApiOkResponse, ApiProperty, ApiResponse, ApiTags, ApiUnauthorizedResponse, refs } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';
import { AuthService } from './auth.service';
import { IsPublic } from './decorators/is-public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthRequest } from './models/AuthRequest';
import { AccessToken } from './models/AccessToken';
import { LoginRequestBody } from 'src/auth/models/LoginRequestBody.dto';
import { ReducedAccessToken } from 'src/auth/models/ReducedAccessToken';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiTags('publico')
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @IsPublic()
    @UseGuards(LocalAuthGuard)
    @ApiBody({ type: LoginRequestBody })
    @ApiBody({ type: LoginRequestBody })
    @ApiExtraModels(AccessToken, ReducedAccessToken)
    @ApiOkResponse({
        schema: { anyOf: refs(AccessToken, ReducedAccessToken) },
    })
    async login(@Request() req: AuthRequest): Promise<AccessToken | ReducedAccessToken> {
        return this.authService.login(req.user);
    }

    @ApiTags('minha-conta')
    @Post('sair')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    async logout(@CurrentUser() user: Pessoa) {
        await this.authService.logout(user);
        return ''
    }
}
