/** Backend is the final admission authority; a signed identity alone is not approval. */
export async function accountAdmission(token: string, userId: string): Promise<'approved' | 'denied' | 'unavailable'> {
  const base = process.env.NEXT_PUBLIC_DELTA_API_URL;
  if (!base || !token) return 'unavailable';
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store', signal: AbortSignal.timeout(5000), redirect: 'error',
    });
    if (response.status === 401 || response.status === 403) return 'denied';
    if (!response.ok) return 'unavailable';
    const data = await response.json();
    return data?.status === 'valid' && data?.user?.user_id === userId && data?.user?.is_guest !== true ? 'approved' : 'denied';
  } catch { return 'unavailable'; }
}
