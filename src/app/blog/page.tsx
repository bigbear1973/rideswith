import Link from 'next/link';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { getAllPosts } from '@/lib/blog';
import { Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | RidesWith',
  description: 'Tips, guides, and stories about group cycling, ride organization, and building cycling communities.',
  openGraph: {
    title: 'Blog | RidesWith',
    description: 'Tips, guides, and stories about group cycling, ride organization, and building cycling communities.',
    type: 'website',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/blog`,
    siteName: 'RidesWith',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/og-default.png`,
        width: 1200,
        height: 630,
        alt: 'RidesWith Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | RidesWith',
    description: 'Tips, guides, and stories about group cycling, ride organization, and building cycling communities.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/og-default.png`],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/blog`,
  },
};

// Arrow icon component
const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px]">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="label-editorial block mb-6">Blog</span>
          <h1 className="heading-display mb-6 font-geist-pixel">
            Cycling tips, guides & stories
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Everything you need to know about organizing group rides, building cycling communities, and getting the most out of your time on two wheels.
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-16 border-t border-border">
            <p className="text-muted-foreground mb-6">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="border-t border-border">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="list-item-editorial group"
              >
                {/* Date */}
                <div className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {format(new Date(post.date), 'MMM d, yyyy')}
                </div>

                {/* Content */}
                <div className="pr-6">
                  {/* Mobile date */}
                  <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {format(new Date(post.date), 'MMM d, yyyy')}
                  </div>
                  <h2 className="text-lg md:text-xl font-medium mb-2 group-hover:text-foreground transition-colors font-geist-pixel">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readingTime} min read
                    </span>
                    {post.tags && post.tags.length > 0 && (
                      <span className="hidden sm:inline">
                        {post.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="icon-btn-circle transition-all group-hover:bg-foreground">
                  <ArrowIcon className="w-4 h-4 transition-all stroke-foreground group-hover:stroke-background" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="max-w-xl">
            <span className="label-editorial block mb-4">Ready to Ride?</span>
            <p className="text-muted-foreground mb-6">
              Join thousands of cyclists discovering and organizing group rides on RidesWith.
            </p>
            <Link href="/discover" className="cta-link">
              <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
              Find a Ride
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
