import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_BYTES,
  describeFileProblem,
} from './uploads';
import { breakDownRemaining } from './auctions';

describe('describeFileProblem', () => {
  it('requires a file', () => {
    expect(describeFileProblem(null)).toContain('مطلوبة');
  });

  it('rejects unsupported MIME types', () => {
    expect(describeFileProblem({ type: 'application/zip', size: 100 })).toContain('غير مدعوم');
  });

  it('rejects files larger than the client-side limit', () => {
    expect(describeFileProblem({ type: ACCEPTED_FILE_TYPES[0], size: MAX_FILE_BYTES + 1 })).toContain('يتجاوز');
  });

  it('accepts supported files within the size limit', () => {
    expect(describeFileProblem({ type: 'application/pdf', size: MAX_FILE_BYTES })).toBe('');
  });
});

describe('breakDownRemaining', () => {
  it('splits a duration into days, hours, minutes, and seconds', () => {
    expect(breakDownRemaining(90061000)).toEqual({
      isOver: false,
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
    });
  });

  it('clamps expired durations to zero', () => {
    expect(breakDownRemaining(-1)).toEqual({
      isOver: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});
