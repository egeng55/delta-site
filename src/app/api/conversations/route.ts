import { conversationProxy } from '@/lib/conversationProxyServer';
export const GET = (request: Request) => conversationProxy(request);
export const POST = (request: Request) => conversationProxy(request);
