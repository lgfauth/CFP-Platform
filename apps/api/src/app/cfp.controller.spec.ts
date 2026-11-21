import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SpeakerDTO } from '@cfp-platform/shared-types';
import request from 'supertest';
import { CfpController } from './cfp.controller';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { configureApp } from './configure-app';

describe('CfpController', () => {
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

  const secondSpeaker: SpeakerDTO = {
    id: 'proposal-2',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    talkTitle: 'Compiladores e a arte de depurar',
    isGDE: false,
  };

  const postSpeaker = (payload: unknown) =>
    request(app.getHttpServer())
      .post('/api/speakers')
      .set('content-type', 'application/json')
      .send(JSON.stringify(payload));

  const listSpeakers = () => request(app.getHttpServer()).get('/api/speakers');

  /** Each call yields a fresh application, equivalent to an API restart. */
  async function createApp(): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const created = configureApp(moduleRef.createNestApplication());
    await created.init();
    return created;
  }

  beforeEach(async () => {
    app = await createApp();
    service = app.get(AppService);
    submitSpy = jest.spyOn(service, 'submitSpeaker');
  });

  afterEach(async () => {
    submitSpy.mockRestore();
    await app.close();
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(app.get(CfpController).getData()).toEqual({ message: 'Hello API' });
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

  describe('GET /api/speakers', () => {
    it('responds 200 with an empty array on a freshly created application', async () => {
      const response = await listSpeakers();

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('lists accepted submissions equal to the payloads, in submission order', async () => {
      expect((await postSpeaker(validSpeaker)).status).toBe(201);
      expect((await postSpeaker(secondSpeaker)).status).toBe(201);

      const response = await listSpeakers();

      expect(response.status).toBe(200);
      expect(response.body).toEqual([validSpeaker, secondSpeaker]);
    });

    it('does not list a submission rejected with 400', async () => {
      const rejected = { ...secondSpeaker, email: 'not-an-email' };

      expect((await postSpeaker(validSpeaker)).status).toBe(201);
      expect((await postSpeaker(rejected)).status).toBe(400);

      const response = await listSpeakers();

      expect(response.status).toBe(200);
      expect(response.body).toEqual([validSpeaker]);
      expect(response.body).not.toContainEqual(rejected);
    });

    it('lists an empty array after a restart (new application instance)', async () => {
      expect((await postSpeaker(validSpeaker)).status).toBe(201);
      expect((await listSpeakers()).body).toEqual([validSpeaker]);

      await app.close();
      app = await createApp();
      service = app.get(AppService);
      submitSpy = jest.spyOn(service, 'submitSpeaker');

      const response = await listSpeakers();

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
