import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SpeakerDTO } from '@cfp-platform/shared-types';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { configureApp } from './configure-app';

describe('AppController', () => {
  let app: INestApplication;
  let service: AppService;
  let submitSpy: jest.SpyInstance;

  const validSpeaker: SpeakerDTO = {
    id: 'proposal-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    talkTitle: 'Computação para todas as pessoas',
    isGDE: true,
  };

  const postSpeaker = (payload: unknown) =>
    request(app.getHttpServer())
      .post('/api/speakers')
      .set('content-type', 'application/json')
      .send(JSON.stringify(payload));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    service = app.get(AppService);
  });

  beforeEach(() => {
    submitSpy = jest.spyOn(service, 'submitSpeaker');
  });

  afterEach(() => submitSpy.mockRestore());

  afterAll(() => app.close());

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(app.get(AppController).getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('POST /api/speakers', () => {
    it('accepts a valid submission and returns the same SpeakerDTO', async () => {
      const response = await postSpeaker(validSpeaker);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(validSpeaker);
      expect(submitSpy).toHaveBeenCalledTimes(1);
      expect(submitSpy).toHaveBeenCalledWith(validSpeaker);
    });

    const requiredFields: (keyof SpeakerDTO)[] = [
      'id',
      'name',
      'email',
      'talkTitle',
      'isGDE',
    ];

    it.each(requiredFields)(
      'rejects a submission without "%s" before reaching the service',
      async (field) => {
        const payload: Partial<SpeakerDTO> = { ...validSpeaker };
        delete payload[field];

        const response = await postSpeaker(payload);

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual(
          expect.arrayContaining([expect.stringContaining(field)])
        );
        expect(submitSpy).not.toHaveBeenCalled();
      }
    );

    it.each<[string, Record<string, unknown>]>([
      ['an invalid email', { ...validSpeaker, email: 'not-an-email' }],
      ['an empty id', { ...validSpeaker, id: '' }],
      ['an empty name', { ...validSpeaker, name: '' }],
      ['a blank name', { ...validSpeaker, name: '   ' }],
      ['an empty talkTitle', { ...validSpeaker, talkTitle: '' }],
      ['a blank talkTitle', { ...validSpeaker, talkTitle: '   ' }],
      ['an id with a non-string type', { ...validSpeaker, id: 123 }],
      ['an isGDE given as a string', { ...validSpeaker, isGDE: 'true' }],
      ['an isGDE given as a number', { ...validSpeaker, isGDE: 1 }],
      ['an unknown property', { ...validSpeaker, unsupported: true }],
    ])('rejects a submission with %s', async (_, payload) => {
      const response = await postSpeaker(payload);

      expect(response.status).toBe(400);
      expect(submitSpy).not.toHaveBeenCalled();
    });
  });
});
