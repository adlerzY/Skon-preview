import { notFound } from "next/navigation";
import Image from "next/image";
import { getPostDetail } from "@/lib/graphql";

interface PostPageProps {
  params: Promise<{ region: string; categorySlug: string; postSlug: string }>;
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { postSlug } = await params;
  const post = await getPostDetail(postSlug);

  if (!post) notFound();

  return (
    <main className="container mx-auto px-6 py-12 text-white max-w-[1200px]">
      <article className="bg-brand-surface p-6 md:p-10 rounded-2xl border border-white/5 space-y-6">
        {post.featuredImage?.node?.sourceUrl && (
          <div className="w-full h-[300px] md:h-[500px] relative rounded-xl overflow-hidden bg-white/5">
            <Image
              src={post.featuredImage.node.sourceUrl}
              alt={post.title}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="space-y-4">
          <h1 className="text-2xl md:text-4xl font-bold text-brand-blue leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-brand-m_khonsa border-b border-white/5 pb-4">
            {post.author?.node?.name && (
              <div>نویسنده: <span className="text-white">{post.author.node.name}</span></div>
            )}
            {post.date && (
              <div>تاریخ: <span className="text-white">{new Date(post.date).toLocaleDateString("fa-IR")}</span></div>
            )}
          </div>
        </div>

        <div 
          className="prose prose-invert max-w-none text-brand-white leading-relaxed space-y-4 font-normal
            prose-headings:text-brand-blue prose-headings:font-bold
            prose-p:text-gray-300 prose-a:text-brand-blue hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}