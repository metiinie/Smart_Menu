import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller() // No prefix here, but it will be under /api because of setGlobalPrefix
export class PublicController {
  @Get()
  getLanding(@Res() res: Response) {
    if (process.env.FRONTEND_URL) {
      return res.redirect(process.env.FRONTEND_URL);
    }
    
    res.status(200).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #f97316;">🚀 ArifSmart API is Running</h1>
        <p>The backend is successfully deployed and connected.</p>
        <div style="margin-top: 20px; padding: 20px; background: #f8fafc; display: inline-block; border-radius: 12px; border: 1px solid #e2e8f0;">
           <p style="margin: 0; font-size: 14px; color: #64748b;">API Base Path: <b>/api</b></p>
           <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">Status: <span style="color: #22c55e; font-weight: bold;">Online</span></p>
        </div>
        <div style="margin-top: 30px;">
          <a href="/api/docs" style="color: #f97316; font-weight: bold; text-decoration: none; border: 1px solid #f97316; padding: 10px 20px; border-radius: 8px;">View API Docs</a>
          <a href="/api/health" style="margin-left: 10px; color: #64748b; font-weight: bold; text-decoration: none; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 8px;">Check Health</a>
        </div>
      </div>
    `);
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'ArifSmart Menu API',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '2.0.0-PROD'
    };
  }
}
