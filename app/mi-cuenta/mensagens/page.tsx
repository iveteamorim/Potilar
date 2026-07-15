import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import MessageComposer from '@/components/MessageComposer';

type MessageRow = {
  id: string;
  listing_id: string;
  listing_owner_id: string;
  sender_user_id: string | null;
  sender_name: string;
  sender_email: string;
  message: string;
  owner_reply?: string | null;
  owner_replied_at?: string | null;
  status: string;
  created_at: string;
  read_at?: string | null;
  listings?: {
    title?: string | null;
    slug?: string | null;
    location?: string | null;
    contact_name?: string | null;
  } | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
};

type Thread = {
  key: string;
  conversationId?: string;
  isModern?: boolean;
  listingId: string;
  ownerId: string;
  seekerName: string;
  seekerEmail: string;
  latestAt: string;
  messages: MessageRow[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function getOwnerName(message: MessageRow | undefined, profile: ProfileRow | undefined) {
  return message?.listings?.contact_name?.trim() || profile?.company_name || profile?.full_name || 'Anunciante';
}

function getLatestPreview(thread: Thread) {
  const latest = [...thread.messages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  if (!latest) return '';
  const replies = latest.owner_reply?.split(/\n{2,}/).filter(Boolean);
  return replies?.at(-1) || latest.message;
}

export default async function MensagensPage({ searchParams }: { searchParams?: { chat?: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/mi-cuenta/mensagens');

  let repliesEnabled = true;
  let modernThreads: Thread[] = [];

  const { data: conversationRows, error: conversationError } = await supabase
    .from('chat_conversations')
    .select('id,listing_id,listing_owner_id,seeker_user_id,seeker_name,seeker_email,advertiser_name,updated_at,listings(title,slug,location,contact_name),chat_messages(id,sender_user_id,body,created_at,read_at)')
    .or(`listing_owner_id.eq.${user.id},seeker_user_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (!conversationError) {
    modernThreads = ((conversationRows ?? []) as any[]).map((conversation) => {
      const chatMessages = ((conversation.chat_messages ?? []) as any[])
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((message) => ({
          id: message.id,
          listing_id: conversation.listing_id,
          listing_owner_id: conversation.listing_owner_id,
          sender_user_id: message.sender_user_id,
          sender_name: message.sender_user_id === conversation.listing_owner_id ? conversation.listings?.contact_name || conversation.advertiser_name || 'Anunciante' : conversation.seeker_name,
          sender_email: conversation.seeker_email,
          message: message.body,
          status: 'sent',
          created_at: message.created_at,
          read_at: message.read_at,
          listings: conversation.listings
        })) as MessageRow[];

      return {
        key: conversation.id,
        conversationId: conversation.id,
        isModern: true,
        listingId: conversation.listing_id,
        ownerId: conversation.listing_owner_id,
        seekerName: conversation.seeker_name,
        seekerEmail: conversation.seeker_email,
        latestAt: conversation.updated_at,
        messages: chatMessages
      };
    });
  }

  let { data, error } = await supabase
    .from('listing_messages')
    .select('id,listing_id,listing_owner_id,sender_user_id,sender_name,sender_email,message,owner_reply,owner_replied_at,status,created_at,read_at,listings(title,slug,location,contact_name)')
    .or(`listing_owner_id.eq.${user.id},sender_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error?.message.toLowerCase().includes('owner_reply')) {
    repliesEnabled = false;
    const fallback = await supabase
      .from('listing_messages')
      .select('id,listing_id,listing_owner_id,sender_user_id,sender_name,sender_email,message,status,created_at,read_at,listings(title,slug,location,contact_name)')
      .or(`listing_owner_id.eq.${user.id},sender_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error?.message.toLowerCase().includes('permission denied')) {
    data = [];
    error = null;
  }

  const messages = (data ?? []) as MessageRow[];
  const ownerIds = Array.from(
    new Set([
      ...messages.map((message) => message.listing_owner_id).filter(Boolean),
      ...modernThreads.map((thread) => thread.ownerId).filter(Boolean)
    ])
  );
  let profiles = new Map<string, ProfileRow>();

  if (ownerIds.length > 0) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id,full_name,company_name,email')
      .in('id', ownerIds);

    profiles = new Map(((profileRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  }

  const legacyThreads = Array.from(
    messages
      .reduce((map, message) => {
        const key = `${message.listing_id}:${message.sender_email}`;
        const existing = map.get(key);

        if (existing) {
          existing.messages.push(message);
          if (new Date(message.created_at) > new Date(existing.latestAt)) {
            existing.latestAt = message.created_at;
          }
        } else {
          map.set(key, {
            key,
            listingId: message.listing_id,
            ownerId: message.listing_owner_id,
            seekerName: message.sender_name,
            seekerEmail: message.sender_email,
            latestAt: message.created_at,
            messages: [message]
          });
        }

        return map;
      }, new Map<string, Thread>())
      .values()
  ).sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());

  const threadMap = new Map<string, Thread>();

  for (const thread of legacyThreads) {
    threadMap.set(`${thread.listingId}:${thread.seekerEmail}`, thread);
  }

  for (const thread of modernThreads) {
    threadMap.set(`${thread.listingId}:${thread.seekerEmail}`, thread);
  }

  const threads = Array.from(threadMap.values()).sort(
    (a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
  );

  const selectedKey = searchParams?.chat ? decodeURIComponent(searchParams.chat) : undefined;
  const selectedThread = selectedKey ? threads.find((thread) => thread.key === selectedKey) : undefined;
  const selectedMessages = selectedThread
    ? [...selectedThread.messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];
  const selectedFirstMessage = selectedMessages[0];
  const selectedLatestMessage = selectedMessages[selectedMessages.length - 1];
  const selectedOwnerProfile = selectedThread ? profiles.get(selectedThread.ownerId) : undefined;
  const selectedIsOwnerView = Boolean(selectedThread && selectedThread.ownerId === user.id);
  const selectedOwnerName = getOwnerName(selectedFirstMessage, selectedOwnerProfile);
  const selectedCounterpartName = selectedThread
    ? selectedIsOwnerView
      ? selectedThread.seekerName
      : selectedOwnerName
    : '';
  const selectedListingHref = selectedFirstMessage?.listings?.slug ? `/imoveis/${selectedFirstMessage.listings.slug}` : selectedThread ? `/ver-anuncio/${selectedThread.listingId}` : '/imoveis';
  const latestReplyTarget = selectedThread
    ? [...selectedMessages].reverse().find((item) => item.listing_owner_id === user.id) ?? selectedLatestMessage
    : undefined;

  const unreadReceivedIds = messages
    .filter((message) => message.sender_user_id !== user.id && !message.read_at)
    .map((message) => message.id);

  if (unreadReceivedIds.length > 0) {
    try {
      await supabase
        .from('listing_messages')
        .update({ read_at: new Date().toISOString(), status: 'read' })
        .in('id', unreadReceivedIds)
        .eq('listing_owner_id', user.id);
    } catch {
      // Legacy read receipts are best-effort; modern chat does not need this fallback.
    }
  }

  return (
    <main className={`${selectedThread ? 'overflow-x-hidden px-0 py-0 sm:px-6 sm:py-4' : 'px-3 py-4 sm:px-6'} lg:px-8`}>
      <div className="mx-auto w-full max-w-6xl">
        <div className={`${selectedThread ? 'hidden lg:flex' : 'mb-4 flex'} items-center justify-between gap-3`}>
          <div>
            <Link href="/mi-cuenta" className="text-sm font-semibold text-ocean-700">
              Voltar para Minha conta
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Mensagens</h1>
          </div>
        </div>

        {error && modernThreads.length === 0 && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error.message}
          </div>
        )}

        {!error && threads.length === 0 && (
          <div className="glass-card p-6 text-sm text-slate-600 dark:text-slate-300">
            Ainda não há mensagens. Quando alguém enviar uma consulta por um anúncio, ela aparecerá aqui.
          </div>
        )}

        {threads.length > 0 && (
          <div className={`${selectedThread ? 'h-[calc(100dvh-5.5rem)] rounded-none border-x-0 border-b-0 sm:h-[calc(100dvh-9rem)] sm:rounded-2xl sm:border' : 'min-h-[calc(100dvh-9rem)] rounded-2xl border'} grid w-full min-w-0 overflow-hidden border-sand-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:h-auto lg:min-h-[680px] lg:grid-cols-[360px_1fr]`}>
            <aside className={`${selectedThread ? 'hidden lg:block' : 'block'} min-w-0 border-r border-sand-100 bg-white dark:border-slate-800 dark:bg-slate-950`}>
              <div className="border-b border-sand-100 px-4 py-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chats</p>
                <p className="mt-1 text-sm text-slate-500">{threads.length} conversa{threads.length > 1 ? 's' : ''}</p>
              </div>
              <div className="max-h-[calc(100dvh-13.5rem)] overflow-y-auto lg:max-h-[610px]">
                {threads.map((thread) => {
                  const ordered = [...thread.messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                  const first = ordered[0];
                  const isOwnerView = thread.ownerId === user.id;
                  const ownerName = getOwnerName(first, profiles.get(thread.ownerId));
                  const counterpartName = isOwnerView ? thread.seekerName : ownerName;
                  const isSelected = selectedThread?.key === thread.key;
                  const preview = getLatestPreview(thread);

                  return (
                    <Link
                      key={thread.key}
                      href={`/mi-cuenta/mensagens?chat=${encodeURIComponent(thread.key)}`}
                      className={`block border-b border-sand-100 px-4 py-4 transition dark:border-slate-800 ${isSelected ? 'bg-ocean-50 dark:bg-slate-900' : 'hover:bg-sand-50 dark:hover:bg-slate-900'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ocean-700 text-sm font-bold text-white">
                          {counterpartName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{counterpartName}</p>
                            <p className="shrink-0 text-[11px] font-semibold text-slate-400">{formatShortDate(thread.latestAt)}</p>
                          </div>
                          <p className="mt-1 truncate text-xs font-semibold text-ocean-700">{first?.listings?.title ?? 'Anuncio'}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{preview}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </aside>

            <section className={`${selectedThread ? 'flex' : 'hidden lg:flex'} h-full min-h-0 min-w-0 flex-col bg-sand-50 dark:bg-slate-900 lg:h-auto lg:min-h-[680px]`}>
              {selectedThread && (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-sand-100 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950 sm:gap-3 sm:px-4 sm:py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Link href="/mi-cuenta/mensagens" className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-200 text-slate-600 lg:hidden" aria-label="Voltar para chats">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-700 text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm">
                        {selectedCounterpartName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{selectedCounterpartName}</p>
                        <p className="truncate text-xs text-slate-500">{selectedFirstMessage?.listings?.title ?? 'Anuncio'}</p>
                      </div>
                    </div>
                    <Link href={selectedListingHref} className="shrink-0 rounded-xl border border-ocean-200 px-2.5 py-2 text-[11px] font-semibold text-ocean-700 sm:px-3 sm:text-xs">
                      Ver anúncio
                    </Link>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:space-y-4 sm:px-4 sm:py-5">
                    {selectedMessages.map((message) => {
                      const userWroteMessage = message.sender_user_id === user.id;
                      const userWroteReply = message.listing_owner_id === user.id;

                      return (
                        <div key={message.id} className="space-y-4">
                          <div className={`${userWroteMessage ? 'ml-auto bg-ocean-700 text-white' : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'} max-w-[90%] rounded-2xl ${userWroteMessage ? 'rounded-tr-md' : 'rounded-tl-md'} px-3.5 py-2.5 text-[13px] leading-5 shadow-sm sm:max-w-[82%] sm:px-4 sm:py-3 sm:text-sm sm:leading-6`}>
                            <p className="whitespace-pre-line">{message.message}</p>
                            <p className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${userWroteMessage ? 'justify-end text-ocean-100' : 'text-slate-400'}`}>
                              {formatDate(message.created_at)}
                              {userWroteMessage && (
                                message.read_at ? <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              {userWroteMessage && (message.read_at ? ' Lido' : ' Enviado')}
                            </p>
                          </div>

                          {message.owner_reply?.split(/\n{2,}/).filter(Boolean).map((reply, index) => (
                            <div key={`${message.id}-reply-${index}`} className={`${userWroteReply ? 'ml-auto bg-ocean-700 text-white' : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'} max-w-[90%] rounded-2xl ${userWroteReply ? 'rounded-tr-md' : 'rounded-tl-md'} px-3.5 py-2.5 text-[13px] leading-5 shadow-sm sm:max-w-[82%] sm:px-4 sm:py-3 sm:text-sm sm:leading-6`}>
                              <p className="whitespace-pre-line">{reply}</p>
                              {message.owner_replied_at && (
                                <p className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${userWroteReply ? 'justify-end text-ocean-100' : 'text-slate-400'}`}>
                                  {formatDate(message.owner_replied_at)}
                                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                  Enviado
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {selectedIsOwnerView && selectedThread.isModern && selectedThread.conversationId && (
                    <MessageComposer mode="message" conversationId={selectedThread.conversationId} />
                  )}

                  {selectedIsOwnerView && !selectedThread.isModern && repliesEnabled && latestReplyTarget && (
                    <MessageComposer mode="reply" messageId={latestReplyTarget.id} />
                  )}

                  {!selectedIsOwnerView && (
                    <MessageComposer
                      mode="message"
                      conversationId={selectedThread.conversationId}
                      listingId={selectedThread.listingId}
                      ownerId={selectedThread.ownerId}
                      senderName={selectedThread.seekerName}
                      senderEmail={selectedThread.seekerEmail || user.email || ''}
                    />
                  )}

                  {selectedIsOwnerView && !repliesEnabled && (
                    <div className="border-t border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                      Para responder por chat, aplique o SQL de respostas em Supabase.
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
