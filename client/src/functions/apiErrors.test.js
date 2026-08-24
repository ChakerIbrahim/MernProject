import { describe, expect, it } from 'vitest';
import { readFieldErrors, readFormError } from './apiErrors';

describe('readFieldErrors', () => {
  it('returns the server field map', () => {
    const error = { response: { data: { errors: { email: 'البريد غير صالح' } } } };
    expect(readFieldErrors(error)).toEqual({ email: 'البريد غير صالح' });
  });

  it('returns an empty map for missing or malformed errors', () => {
    expect(readFieldErrors({ response: { data: { error: 'failed' } } })).toEqual({});
    expect(readFieldErrors(null)).toEqual({});
  });
});

describe('readFormError', () => {
  it('prefers an explicit error message', () => {
    expect(readFormError({ response: { data: { error: 'فشل الطلب' } } })).toBe('فشل الطلب');
  });

  it('supports the server message property', () => {
    expect(readFormError({ response: { data: { message: 'حاول لاحقاً' } } })).toBe('حاول لاحقاً');
  });

  it('returns a validation summary for field errors', () => {
    expect(readFormError({ response: { data: { errors: { name: 'مطلوب' } } } })).toContain('تصحيح');
  });

  it('never exposes raw transport errors', () => {
    expect(readFormError(new Error('secret database details'))).toContain('تعذّر');
  });
});
