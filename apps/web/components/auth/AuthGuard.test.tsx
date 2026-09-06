import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AuthGuard from './AuthGuard';
import { api } from '@/lib/api';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard/ca',
}));

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

function mockUser(role: string, customRole: string | null = null) {
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { role, customRole } });
}

beforeEach(() => {
  replace.mockClear();
  (api.get as ReturnType<typeof vi.fn>).mockReset();
  localStorage.setItem('infinito_token', 'test-token');
});

describe('AuthGuard', () => {
  it('authorizes a CAMPUS_AMBASSADOR user against the CA dashboard guard', async () => {
    mockUser('CAMPUS_AMBASSADOR');

    render(
      <AuthGuard allowedRoles={['CAMPUS_AMBASSADOR', 'ADMIN']}>
        <div>ca dashboard</div>
      </AuthGuard>
    );

    expect(await screen.findByText('ca dashboard')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects a CAMPUS_AMBASSADOR user when allowedRoles uses the stale "CA" string', async () => {
    mockUser('CAMPUS_AMBASSADOR');

    render(
      <AuthGuard allowedRoles={['CA', 'ADMIN']}>
        <div>ca dashboard</div>
      </AuthGuard>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard/ca'));
    expect(screen.queryByText('ca dashboard')).not.toBeInTheDocument();
  });

  it('authorizes an ADMIN user against the CA dashboard guard', async () => {
    mockUser('ADMIN');

    render(
      <AuthGuard allowedRoles={['CAMPUS_AMBASSADOR', 'ADMIN']}>
        <div>ca dashboard</div>
      </AuthGuard>
    );

    expect(await screen.findByText('ca dashboard')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
