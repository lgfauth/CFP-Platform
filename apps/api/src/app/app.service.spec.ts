import { Test } from '@nestjs/testing';
import { SpeakerDTO } from '@cfp-platform/shared-types';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  const ada: SpeakerDTO = {
    id: 'proposal-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    talkTitle: 'Computação para todas as pessoas',
    isGDE: true,
  };

  const grace: SpeakerDTO = {
    id: 'proposal-2',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    talkTitle: 'Compiladores e a arte de depurar',
    isGDE: false,
  };

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(service.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('submitSpeaker', () => {
    it('returns a plain copy with exactly the five contract fields', () => {
      const payload = Object.assign(Object.create({ inherited: true }), {
        ...ada,
        extra: 'ignored',
      }) as SpeakerDTO;

      const result = service.submitSpeaker(payload);

      expect(result).not.toBe(payload);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(Object.keys(result).sort()).toEqual(
        ['email', 'id', 'isGDE', 'name', 'talkTitle']
      );
      expect(result).toEqual(ada);
      expect(service.listSpeakers()).toEqual([ada]);
    });
  });

  describe('listSpeakers', () => {
    it('starts empty', () => {
      expect(service.listSpeakers()).toEqual([]);
    });

    it('preserves insertion order', () => {
      service.submitSpeaker(ada);
      service.submitSpeaker(grace);

      expect(service.listSpeakers()).toEqual([ada, grace]);
    });

    it('is not affected when the returned array is modified', () => {
      service.submitSpeaker(ada);

      const listed = service.listSpeakers();
      listed.push(grace);
      listed.pop();
      listed.pop();

      expect(service.listSpeakers()).toEqual([ada]);
    });
  });
});
