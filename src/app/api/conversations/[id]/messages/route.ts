import { conversationProxy } from '@/lib/conversationProxyServer';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return conversationProxy(request, (await context.params).id);
}
