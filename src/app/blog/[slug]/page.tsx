import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { getPostBySlug, getAllPostSlugs } from '@/lib/blog';
import { Clock, ChevronLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | RidesWith Blog',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com';

  return {
    title: `${post.title} | RidesWith Blog`,
    description: post.excerpt,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
  };
}

// Simple markdown to HTML converter (no external dependencies)
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-8 mb-4">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-10 mb-4">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-12 mb-6">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-foreground underline hover:no-underline">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-6 w-full" />');

  // Unordered lists - simple approach
  html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li class="ml-6 mb-2 list-disc">$1</li>');

  // Ordered lists
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gim, '<li class="ml-6 mb-2 list-decimal">$2</li>');

  // Blockquotes
  html = html.replace(/^>\s*(.*$)/gim, '<blockquote class="border-l-4 border-border pl-4 my-6 italic text-muted-foreground">$1</blockquote>');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 my-6 overflow-x-auto"><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="my-8 border-border" />');

  // Paragraphs (wrap remaining text)
  html = html.split('\n\n').map((block) => {
    // Don't wrap if it's already an HTML element
    if (block.trim().startsWith('<') || block.trim() === '') {
      return block;
    }
    return `<p class="mb-4 leading-relaxed">${block.replace(/\n/g, '<br />')}</p>`;
  }).join('\n');

  return html;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const contentHtml = markdownToHtml(post.content);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com';

  // JSON-LD structured data for the article
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    datePublished: post.date,
    image: post.coverImage,
    publisher: {
      '@type': 'Organization',
      name: 'RidesWith',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icons/icon-512.png`,
      },
    },
  };

  return (
    <div className="min-h-screen">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-foreground hover:text-background -ml-2">
            <Link href="/blog">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="w-full h-64 md:h-96 bg-muted">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 md:px-[60px] py-12 md:py-16">
        {/* Meta */}
        <div className="mb-8">
          <span className="label-editorial block mb-4">
            {format(new Date(post.date), 'MMMM d, yyyy')}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 font-geist-pixel">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>By {post.author}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readingTime} min read
            </span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs uppercase tracking-wider bg-muted rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="prose prose-neutral dark:prose-invert max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Share / CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <span className="label-editorial block mb-2">Enjoyed this article?</span>
              <p className="text-muted-foreground text-sm">
                Share it with your cycling friends!
              </p>
            </div>
            <Link href="/discover" className="cta-link">
              <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
              Find a Ride
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
