import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // CORS — allow Next.js frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // API prefix
  app.setGlobalPrefix('api');

  // Root Landing (Helpful for developers)
  const adapter = app.getHttpAdapter();
  adapter.get('/', (req, res) => {
    res.type('text/html').send(`
      <div style="font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; background: #FCFAF7;">
        <h1 style="color: #f97316;">🚀 ArifSmart API is Running</h1>
        <p style="color: #64748b;">This is the API server. For the customer menu, please visit:</p>
        <a href="http://localhost:3000" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 10px;">Go to Menu (Port 3000)</a>
        <p style="margin-top: 20px;"><a href="/api/docs" style="color: #94a3b8; font-size: 12px;">View API Documentation</a></p>
      </div>
    `);
  });
  adapter.get('/api', (req, res) => res.redirect('/api/docs'));

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('ArifSmart Menu API')
    .setDescription('QR-based restaurant ordering system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '127.0.0.1');
  console.log(`🚀 ArifSmart API running on http://127.0.0.1:${port}/api`);
  console.log(`📚 Swagger docs at http://127.0.0.1:${port}/api/docs`);
}

bootstrap();
