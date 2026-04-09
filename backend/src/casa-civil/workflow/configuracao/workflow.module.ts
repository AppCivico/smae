import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [WorkflowController],
    providers: [WorkflowService],
    exports: [WorkflowService],
})
export class WorkflowModule {}
