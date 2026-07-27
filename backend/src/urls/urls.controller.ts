import {
  Controller, Post, Get, Delete, Param, Body,
  Req, Res, UseGuards, HttpCode
} from "@nestjs/common";
import { UrlsService } from "./urls.service";
import { CreateUrlDto } from "./dto/create-url.dto";
import { ApiKeyGuard } from "../auth/api-key.guard";
import { Response, Request } from "express";

@Controller()
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  // POST /api/urls — create a short link (protected)
  @Post("urls")
  @UseGuards(ApiKeyGuard)
  async create(@Body() dto: CreateUrlDto) {
    return this.urlsService.create(dto);
  }

  // GET /r/:code — the redirect endpoint (public, hot path)
  @Get("r/:code")
  async redirect(
    @Param("code") code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const longUrl = await this.urlsService.redirect(code, req);
    // 302 = temporary redirect (don't cache in browser — good for analytics)
    return res.redirect(302, longUrl);
  }

  // GET /api/urls — list all links (protected)
  @Get("urls")
  @UseGuards(ApiKeyGuard)
  async getAll() {
    return this.urlsService.getAll();
  }

  // GET /api/urls/:code — get single link + stats (protected)
  @Get("urls/:code")
  @UseGuards(ApiKeyGuard)
  async getOne(@Param("code") code: string) {
    return this.urlsService.getOne(code);
  }

  // DELETE /api/urls/:code — deactivate a link (protected)
  @Delete("urls/:code")
  @UseGuards(ApiKeyGuard)
  @HttpCode(200)
  async delete(@Param("code") code: string) {
    return this.urlsService.delete(code);
  }

  // GET /api/dashboard — overall stats
  @Get("dashboard")
  @UseGuards(ApiKeyGuard)
  async dashboard() {
    return this.urlsService.getDashboard();
  }

  // GET /api/health — Railway health check
  @Get("health")
  health() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
