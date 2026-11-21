import type { SpeakerDTO } from '@cfp-platform/shared-types';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../../app.config';
import { AppModule } from '../app.module';
import { SpeakersService } from './speakers.service';

describe('SpeakersController', () => {
  const validSpeaker: SpeakerDTO = {
    id: 'speaker-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    talkTitle: 'Computing the future',
    isGDE: true,
  };
  let app: INestApplication;
  let submitSpy: jest.SpyInstance;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    submitSpy = jest.spyOn(moduleRef.get(SpeakersService), 'submit');
  });

  beforeEach(() => {
    submitSpy.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the submitted speaker for a valid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/speakers')
      .send(validSpeaker)
      .expect(201)
      .expect(validSpeaker);

    expect(submitSpy).toHaveBeenCalledWith(validSpeaker);
  });

  it.each(Object.keys(validSpeaker) as Array<keyof SpeakerDTO>)(
    'rejects a payload without %s before reaching the service',
    async (field) => {
      const invalidSpeaker: Partial<SpeakerDTO> = { ...validSpeaker };
      delete invalidSpeaker[field];

      await request(app.getHttpServer())
        .post('/api/speakers')
        .send(invalidSpeaker)
        .expect(400);

      expect(submitSpy).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['an invalid email', { ...validSpeaker, email: 'invalid-email' }],
    ['an empty email', { ...validSpeaker, email: '' }],
    ['an empty id', { ...validSpeaker, id: '' }],
    ['an empty name', { ...validSpeaker, name: '' }],
    ['an empty talk title', { ...validSpeaker, talkTitle: '' }],
    ['a blank id', { ...validSpeaker, id: '   ' }],
    ['a blank name', { ...validSpeaker, name: '   ' }],
    ['a blank talk title', { ...validSpeaker, talkTitle: '   ' }],
    ['an id with the wrong type', { ...validSpeaker, id: 42 }],
    ['isGDE with the wrong type', { ...validSpeaker, isGDE: 'true' }],
    [
      'an unknown property',
      { ...validSpeaker, unexpectedProperty: 'not-allowed' },
    ],
  ])('rejects %s before reaching the service', async (_description, payload) => {
    await request(app.getHttpServer())
      .post('/api/speakers')
      .send(payload)
      .expect(400);

    expect(submitSpy).not.toHaveBeenCalled();
  });
});
