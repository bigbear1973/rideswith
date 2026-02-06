import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getAllPosts } from '@/lib/blog';

// Force dynamic generation - sitemap needs database access
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/discover`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/discover/past`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/communities`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/telegram`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Fetch upcoming rides (next 90 days)
  const rides = await prisma.ride.findMany({
    where: {
      status: 'PUBLISHED',
      date: {
        gte: new Date(),
        lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: {
      date: 'asc',
    },
    take: 1000, // Limit to prevent huge sitemaps
  });

  const ridePages: MetadataRoute.Sitemap = rides.map((ride) => ({
    url: `${BASE_URL}/rides/${ride.id}`,
    lastModified: ride.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Fetch communities (brands)
  const communities = await prisma.brand.findMany({
    select: {
      slug: true,
      updatedAt: true,
      chapters: {
        select: {
          slug: true,
          updatedAt: true,
        },
      },
    },
    take: 500,
  });

  const communityPages: MetadataRoute.Sitemap = communities.map((community) => ({
    url: `${BASE_URL}/communities/${community.slug}`,
    lastModified: community.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Fetch chapters
  const chapterPages: MetadataRoute.Sitemap = communities.flatMap((community) =>
    community.chapters.map((chapter) => ({
      url: `${BASE_URL}/communities/${community.slug}/${chapter.slug}`,
      lastModified: chapter.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // Fetch public user profiles
  const users = await prisma.user.findMany({
    where: {
      slug: {
        not: null,
      },
    },
    select: {
      slug: true,
      updatedAt: true,
    },
    take: 1000,
  });

  const userPages: MetadataRoute.Sitemap = users
    .filter((user) => user.slug)
    .map((user) => ({
      url: `${BASE_URL}/u/${user.slug}`,
      lastModified: user.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

  // Blog pages
  const blogPosts = getAllPosts();
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  return [
    ...staticPages,
    ...blogPages,
    ...ridePages,
    ...communityPages,
    ...chapterPages,
    ...userPages,
  ];
}
