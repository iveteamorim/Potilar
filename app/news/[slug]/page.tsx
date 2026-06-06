import { redirect } from 'next/navigation';

export default function OldNewsArticlePage({ params }: { params: { slug: string } }) {
  redirect(`/noticias/${params.slug}`);
}
