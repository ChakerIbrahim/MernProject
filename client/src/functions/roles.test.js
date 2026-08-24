import { describe, expect, it } from 'vitest';
import { dashboardPathFor, isApprovedOrganization } from './roles';

describe('dashboardPathFor', () => {
  it('routes admins to the admin dashboard', () => {
    expect(dashboardPathFor('admin')).toBe('/admin/dashboard');
  });

  it('routes organizations to the organization dashboard', () => {
    expect(dashboardPathFor('organization')).toBe('/org/dashboard');
  });

  it('routes individuals and unknown roles to the individual dashboard', () => {
    expect(dashboardPathFor('individual')).toBe('/dashboard');
    expect(dashboardPathFor(undefined)).toBe('/dashboard');
  });
});

describe('isApprovedOrganization', () => {
  it('accepts only approved organizations', () => {
    expect(isApprovedOrganization({ role: 'organization', status: 'approved' })).toBe(true);
    expect(isApprovedOrganization({ role: 'organization', status: 'pending' })).toBe(false);
    expect(isApprovedOrganization({ role: 'individual', status: 'approved' })).toBe(false);
    expect(isApprovedOrganization(null)).toBe(false);
  });
});
