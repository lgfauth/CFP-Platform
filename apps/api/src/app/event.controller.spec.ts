import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventDTO, SpeakerDTO, toIsoDate } from '@cfp-platform/shared-types';
import request from 'supertest';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { EventService } from './event.service';

/** Local calendar day shifted by `offset` days from the current day. */
function dayFromToday(offset: number): string {
  const now = new Date();
  return toIsoDate(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
  );
}

describe('EventController', () => {
  let app: INestApplication;
  let registerSpy: jest.SpyInstance;

  const validEvent: EventDTO = {
    id: 'event-1',
    name: 'DevFest Sul',
    address: 'Av. Ipiranga, 6681 - Porto Alegre, RS',
    date: dayFromToday(1),
  };

  const secondEvent: EventDTO = {
    id: 'event-2',
    name: 'TDC Florianópolis',
    address: 'Centro de Eventos, Florianópolis, SC',
    date: dayFromToday(90),
  };

  const postEvent = (payload: unknown) =>
    request(app.getHttpServer())
      .post('/api/events')
      .set('content-type', 'application/json')
      .send(JSON.stringify(payload));

  const listEvents = () => request(app.getHttpServer()).get('/api/events');

  /** Each call yields a fresh application, equivalent to an API restart. */
  async function createApp(): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const created = configureApp(moduleRef.createNestApplication());
    await created.init();
    return created;
  }

  async function startApp(): Promise<void> {
    app = await createApp();
    registerSpy = jest.spyOn(app.get(EventService), 'registerEvent');
  }

  beforeEach(startApp);

  afterEach(async () => {
    registerSpy.mockRestore();
    await app.close();
  });

  describe('POST /api/events', () => {
    it('accepts an event dated tomorrow and returns the same EventDTO', async () => {
      const response = await postEvent(validEvent);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(validEvent);
      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(registerSpy).toHaveBeenCalledWith(validEvent);
    });

    const requiredFields: (keyof EventDTO)[] = ['id', 'name', 'address', 'date'];

    it.each(requiredFields)(
      'rejects an event without "%s" before reaching the service',
      async (field) => {
        const payload: Partial<EventDTO> = { ...validEvent };
        delete payload[field];

        const response = await postEvent(payload);

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual(
          expect.arrayContaining([expect.stringContaining(field)])
        );
        expect(registerSpy).not.toHaveBeenCalled();
      }
    );

    it.each<[string, Record<string, unknown>]>([
      ['an empty id', { ...validEvent, id: '' }],
      ['an empty name', { ...validEvent, name: '' }],
      ['a blank name', { ...validEvent, name: '   ' }],
      ['an empty address', { ...validEvent, address: '' }],
      ['a blank address', { ...validEvent, address: '   ' }],
      ['a numeric id', { ...validEvent, id: 123 }],
      ['a numeric name', { ...validEvent, name: 42 }],
      ['an address given as an object', { ...validEvent, address: { street: 'x' } }],
      ['a numeric date', { ...validEvent, date: Date.now() }],
      ['an unknown property', { ...validEvent, unsupported: true }],
    ])('rejects an event with %s', async (_, payload) => {
      const response = await postEvent(payload);

      expect(response.status).toBe(400);
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it.each<[string, string]>([
      ['today', dayFromToday(0)],
      ['yesterday', dayFromToday(-1)],
      ['a day long past', '2020-01-01'],
      ['a non-existent day', '2099-02-30'],
      ['a date with time', `${dayFromToday(10)}T10:00:00Z`],
      ['a Brazilian formatted date', '01/02/2099'],
      ['an empty date', ''],
    ])('rejects an event dated %s', async (_, date) => {
      const response = await postEvent({ ...validEvent, date });

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('date')])
      );
      expect(registerSpy).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/events', () => {
    it('responds 200 with an empty array on a freshly created application', async () => {
      const response = await listEvents();

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('lists accepted events equal to the payloads, in registration order', async () => {
      expect((await postEvent(validEvent)).status).toBe(201);
      expect((await postEvent(secondEvent)).status).toBe(201);

      const response = await listEvents();

      expect(response.status).toBe(200);
      expect(response.body).toEqual([validEvent, secondEvent]);
    });

    it('does not list an event rejected with 400', async () => {
      const rejected = { ...secondEvent, date: dayFromToday(0) };

      expect((await postEvent(validEvent)).status).toBe(201);
      expect((await postEvent(rejected)).status).toBe(400);

      const response = await listEvents();

      expect(response.body).toEqual([validEvent]);
      expect(response.body).not.toContainEqual(rejected);
    });

    it('lists an empty array after a restart (new application instance)', async () => {
      expect((await postEvent(validEvent)).status).toBe(201);
      expect((await listEvents()).body).toEqual([validEvent]);

      registerSpy.mockRestore();
      await app.close();
      await startApp();

      const response = await listEvents();

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('keeps events independent from speaker submissions', async () => {
      const speaker: SpeakerDTO = {
        id: 'proposal-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        talkTitle: 'Computação para todas as pessoas',
        isGDE: true,
      };

      expect((await postEvent(validEvent)).status).toBe(201);
      expect((await listSpeakersOf(app)).body).toEqual([]);

      await request(app.getHttpServer()).post('/api/speakers').send(speaker);

      expect((await listSpeakersOf(app)).body).toEqual([speaker]);
      expect((await listEvents()).body).toEqual([validEvent]);
    });
  });
});

function listSpeakersOf(app: INestApplication) {
  return request(app.getHttpServer()).get('/api/speakers');
}
