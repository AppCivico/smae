import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as requestIp from 'request-ip';
import { Request } from 'express';

export const IpAddress = createParamDecorator((data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return extractIpAddress(request);
});

export const extractIpAddress = (request: Request): string => {
    if (request.headers['cf-connecting-ip']) return request.headers['cf-connecting-ip'] as string;

    const ip = requestIp.getClientIp(request);
    if (Array.isArray(ip)) return ip[0];

    return requestIp.getClientIp(request) || '0.0.0.0';
};
