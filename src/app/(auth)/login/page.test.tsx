import { act, fireEvent, render, screen } from '@testing-library/react';
import Page from './page';
import { useAuth } from '@/context/AuthContext';
import { hasSupabaseConfiguration } from '@/lib/supabase';
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/supabase', () => ({ hasSupabaseConfiguration: jest.fn() }));
jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('redirect=/hq') }));
beforeEach(() => { jest.resetAllMocks(); });
it('does not collect a password when this checkout cannot sign in', () => {
  jest.mocked(useAuth).mockReturnValue({ login: jest.fn() } as unknown as ReturnType<typeof useAuth>);
  jest.mocked(hasSupabaseConfiguration).mockReturnValue(false);
  render(<Page />);
  expect(screen.getByText('Sign-in is not connected here.')).toBeInTheDocument();
  expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Delta' })).toHaveAttribute('src', '/delta-logo.svg');
});
it('bounds a hung login, rejects duplicate submits and clears the password', async () => {
  jest.useFakeTimers();
  const login = jest.fn(() => new Promise(() => {}));
  jest.mocked(useAuth).mockReturnValue({ login } as unknown as ReturnType<typeof useAuth>);
  jest.mocked(hasSupabaseConfiguration).mockReturnValue(true);
  try {
    render(<Page />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'fixture' } });
    const form = screen.getByLabelText('Email').closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(login).toHaveBeenCalledTimes(1);
    await act(async () => { jest.advanceTimersByTime(15001); });
    expect(screen.getByRole('alert')).toHaveTextContent('timed out');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled();
  } finally { jest.useRealTimers(); }
});
it('distinguishes a transport failure from rejected credentials',async()=>{
 jest.mocked(useAuth).mockReturnValue({login:jest.fn().mockResolvedValue({success:false,error:'auth_service_unavailable'})} as unknown as ReturnType<typeof useAuth>);
 jest.mocked(hasSupabaseConfiguration).mockReturnValue(true);render(<Page/>);
 fireEvent.change(screen.getByLabelText('Email'),{target:{value:'owner@example.test'}});fireEvent.change(screen.getByLabelText('Password'),{target:{value:'fixture'}});fireEvent.submit(screen.getByLabelText('Email').closest('form')!);
 expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the sign-in service');expect(screen.getByLabelText('Password')).toHaveValue('');
});
