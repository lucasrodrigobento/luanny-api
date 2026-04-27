import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../tenant.service';
import { Tenant } from '../entities/tenant.entity';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let slug: string | undefined;

    const headerSlug = req.headers['x-tenant-slug'] as string;
    if (headerSlug) {
      slug = headerSlug;
    } else {
      const hostname = req.hostname;
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        slug = parts[0];
      }
    }

    if (!slug) {
      throw new UnauthorizedException('Tenant não identificado');
    }

    try {
      const tenant = await this.tenantService.findBySlug(slug);
      req.tenant = tenant;
      next();
    } catch (error) {
      throw new UnauthorizedException('Tenant inválido ou inativo');
    }
  }
}
