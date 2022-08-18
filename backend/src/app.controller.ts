import { Controller, Get } from '@nestjs/common';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller()
export class AppController {
    constructor() { }

    @IsPublic()
    @Get('/ping')
    async ping() {
        return 'pong';
    }
}
