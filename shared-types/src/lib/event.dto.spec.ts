import {
  isFutureIsoDate,
  isValidIsoDate,
  minFutureIsoDate,
  toIsoDate,
} from './event.dto';

describe('event date rules', () => {
  /** 2026-11-21, 15:30 local time. */
  const now = new Date(2026, 10, 21, 15, 30);

  describe('toIsoDate', () => {
    it('formats the local calendar day with zero padding', () => {
      expect(toIsoDate(new Date(2027, 0, 5, 23, 59))).toBe('2027-01-05');
      expect(toIsoDate(now)).toBe('2026-11-21');
    });
  });

  describe('isValidIsoDate', () => {
    it.each(['2027-01-01', '2028-02-29', '2026-12-31'])(
      'accepts %s',
      (value) => {
        expect(isValidIsoDate(value)).toBe(true);
      }
    );

    it.each([
      '2027-02-30',
      '2027-02-29',
      '2027-13-01',
      '2027-00-10',
      '2027-01-32',
      '27-01-01',
      '2027-1-1',
      '2027-01-01T10:00',
      '01/02/2027',
      ' 2027-01-01',
      '',
    ])('rejects "%s"', (value) => {
      expect(isValidIsoDate(value)).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(isValidIsoDate(20270101 as unknown as string)).toBe(false);
      expect(isValidIsoDate(undefined as unknown as string)).toBe(false);
    });
  });

  describe('isFutureIsoDate', () => {
    it('accepts tomorrow and later days', () => {
      expect(isFutureIsoDate('2026-11-22', now)).toBe(true);
      expect(isFutureIsoDate('2027-06-01', now)).toBe(true);
    });

    it('rejects today and past days', () => {
      expect(isFutureIsoDate('2026-11-21', now)).toBe(false);
      expect(isFutureIsoDate('2026-11-20', now)).toBe(false);
      expect(isFutureIsoDate('2020-01-01', now)).toBe(false);
    });

    it('rejects future values that are not valid dates', () => {
      expect(isFutureIsoDate('2027-02-30', now)).toBe(false);
      expect(isFutureIsoDate('2027-01-01T10:00', now)).toBe(false);
    });

    it('defaults to the current clock', () => {
      expect(isFutureIsoDate(toIsoDate(new Date()))).toBe(false);
      expect(isFutureIsoDate(minFutureIsoDate())).toBe(true);
    });
  });

  describe('minFutureIsoDate', () => {
    it('returns the next local day', () => {
      expect(minFutureIsoDate(now)).toBe('2026-11-22');
    });

    it('rolls over months and years', () => {
      expect(minFutureIsoDate(new Date(2027, 0, 31, 8))).toBe('2027-02-01');
      expect(minFutureIsoDate(new Date(2026, 11, 31, 23, 59))).toBe(
        '2027-01-01'
      );
      expect(minFutureIsoDate(new Date(2028, 1, 28))).toBe('2028-02-29');
    });
  });
});
