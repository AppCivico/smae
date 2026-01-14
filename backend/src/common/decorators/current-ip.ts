import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as requestIp from 'request-ip';
import { Request } from 'express';
import { isIP, isIPv4, isIPv6 } from 'net';

export const IpAddress = createParamDecorator((data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return extractIpAddress(request);
});

export const extractIpAddress = (request: Request): string => {
    if (request.headers['cf-connecting-ip']) return request.headers['cf-connecting-ip'] as string;

    const ip = requestIp.getClientIp(request);
    if (Array.isArray(ip)) return ip[0];

    let ipAddress = requestIp.getClientIp(request) || '0.0.0.0';
    // if multiple ips, take the last one (the first one is the proxy)
    if (ipAddress.includes(',')) {
        ipAddress = ipAddress.split(',').pop()?.trim() || '0.0.0.0';
    }

    if (!isIP(ipAddress)) {
        return '0.0.0.0';
    }

    return ipAddress;
};
