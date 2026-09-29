import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { getSupabase } from '@/lib/supabase';
jest.mock('@/lib/supabase', () => ({ getSupabase: jest.fn(), isDeveloperEmail: () => false }));
const session = { user: { id: 'owner-fixture', email: 'owner@example.test' } };
function Consumer() {
  const auth = useAuth();
  return <><span>{auth.isLoading ? 'loading' : auth.user?.id || 'signed-out'}</span><button onClick={() => auth.login('owner@example.test', 'fixture')}>Login</button></>;
}
it('a missing configuration fails without an uncaught effect error', async () => {
  jest.mocked(getSupabase).mockImplementation(() => { throw new Error('unconfigured'); });
  render(<AuthProvider><Consumer /></AuthProvider>);
  expect(await screen.findByText('signed-out')).toBeInTheDocument();
});
it('the session callback is synchronous and profile reads cannot hold login hostage or resurrect signout', async () => {
  let callback!: (event: string, value: typeof session | null) => unknown;
  let finishProfile!: (value: unknown) => void;
  const single = jest.fn(() => new Promise(resolve => { finishProfile = resolve; }));
  const from = jest.fn(() => ({ select: () => ({ eq: () => ({ single }) }) }));
  const auth = {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: jest.fn(cb => { callback = cb; return { data: { subscription: { unsubscribe: jest.fn() } } }; }),
    signInWithPassword: jest.fn(async () => {
      expect(callback('SIGNED_IN', session)).toBeUndefined();
      expect(from).not.toHaveBeenCalled();
      return { data: { user: session.user, session }, error: null };
    }),
  };
  jest.mocked(getSupabase).mockReturnValue({ auth, from } as unknown as ReturnType<typeof getSupabase>);
  render(<AuthProvider><Consumer /></AuthProvider>);
  await screen.findByText('signed-out');
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  expect(await screen.findByText('owner-fixture')).toBeInTheDocument();
  await waitFor(() => expect(from).toHaveBeenCalled());
  act(() => { callback('SIGNED_OUT', null); });
  await act(async () => { finishProfile({ data: { role: 'admin' }, error: null }); });
  expect(screen.getByText('signed-out')).toBeInTheDocument();
});
it('keeps a valid identity when optional account reads fail, without inventing access',async()=>{
 const warn=jest.spyOn(console,'warn').mockImplementation(()=>{});
 const from=jest.fn(()=>({select:()=>({eq:()=>({single:async()=>({data:null,error:{code:'42501'}})})})}));
 jest.mocked(getSupabase).mockReturnValue({from,auth:{getSession:async()=>({data:{session}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe:jest.fn()}}})}} as unknown as ReturnType<typeof getSupabase>);
 function Account(){const a=useAuth();return <span>{a.user?.id}:{a.access===null?'unknown':'known'}</span>;}
 try{render(<AuthProvider><Account/></AuthProvider>);await waitFor(()=>expect(warn).toHaveBeenCalledWith('account_details_unavailable'));expect(screen.getByText('owner-fixture:unknown')).toBeInTheDocument();}finally{warn.mockRestore();}
});
