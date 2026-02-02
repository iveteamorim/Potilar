import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5584999999999"
      className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:scale-105"
      aria-label="Falar com atendimento no WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}
