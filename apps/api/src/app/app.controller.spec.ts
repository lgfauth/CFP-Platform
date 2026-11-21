import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressInfo } from 'node:net';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;
  let server: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    server = app.createNestApplication();
    server.setGlobalPrefix('api');
    server.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );
    await server.listen(0);

    const address = server.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(() => server.close());

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('speaker submission', () => {
    const validSpeaker = {
      id: 'proposal-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      talkTitle: 'Computação para todas as pessoas',
      isGDE: true,
    };

    it('accepts a valid speaker submission', async () => {
      const response = await fetch(`${baseUrl}/api/speakers`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validSpeaker),
      });

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual(validSpeaker);
    });

    it.each([
      ['missing field', { ...validSpeaker, name: undefined }],
      ['invalid email', { ...validSpeaker, email: 'invalid' }],
      ['wrong boolean type', { ...validSpeaker, isGDE: 'true' }],
      ['blank text', { ...validSpeaker, talkTitle: '   ' }],
      ['unknown property', { ...validSpeaker, unsupported: true }],
    ])('rejects a submission with %s', async (_, payload) => {
      const response = await fetch(`${baseUrl}/api/speakers`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
    });
  });
});
