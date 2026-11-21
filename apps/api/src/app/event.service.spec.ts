import { Test } from '@nestjs/testing';
import { EventDTO } from '@cfp-platform/shared-types';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;

  const devFest: EventDTO = {
    id: 'event-1',
    name: 'DevFest Sul',
    address: 'Av. Ipiranga, 6681 - Porto Alegre, RS',
    date: '2027-03-05',
  };

  const tdc: EventDTO = {
    id: 'event-2',
    name: 'TDC Florianópolis',
    address: 'Centro de Eventos, Florianópolis, SC',
    date: '2027-05-20',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [EventService],
    }).compile();

    service = moduleRef.get(EventService);
  });

  describe('registerEvent', () => {
    it('returns a plain copy with exactly the four contract fields', () => {
      const payload = Object.assign(Object.create({ inherited: true }), {
        ...devFest,
        extra: 'ignored',
      }) as EventDTO;

      const result = service.registerEvent(payload);

      expect(result).not.toBe(payload);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(Object.keys(result).sort()).toEqual([
        'address',
        'date',
        'id',
        'name',
      ]);
      expect(result).toEqual(devFest);
      expect(service.listEvents()).toEqual([devFest]);
    });
  });

  describe('listEvents', () => {
    it('starts empty', () => {
      expect(service.listEvents()).toEqual([]);
    });

    it('preserves insertion order', () => {
      service.registerEvent(devFest);
      service.registerEvent(tdc);

      expect(service.listEvents()).toEqual([devFest, tdc]);
    });

    it('is not affected when the returned array or items are modified', () => {
      service.registerEvent(devFest);

      const listed = service.listEvents();
      listed[0].name = 'changed';
      listed.push(tdc);

      expect(service.listEvents()).toEqual([devFest]);
    });
  });
});
