import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Users,
  Bike,
  Plus,
  Globe,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBrand(slug: string) {
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      chapters: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  slug: true,
                },
              },
            },
            orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
          },
          _count: {
            select: {
              rides: {
                where: {
                  status: "PUBLISHED",
                  date: { gte: new Date() },
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  return brand;
}

export default async function BrandPage({ params }: PageProps) {
  const { slug } = await params;
  const brand = await getBrand(slug);

  if (!brand) {
    notFound();
  }

  const totalMembers = brand.chapters.reduce((sum, c) => sum + c.memberCount, 0);
  const totalUpcomingRides = brand.chapters.reduce(
    (sum, c) => sum + c._count.rides,
    0
  );
  const totalRides = brand.chapters.reduce((sum, c) => sum + c.rideCount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Brand Colors */}
      <div
        className="py-16 text-white"
        style={{ backgroundColor: brand.primaryColor || "#00D26A" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-20 w-20 object-contain rounded-lg bg-white p-2"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-white/20 flex items-center justify-center text-3xl font-bold">
                {brand.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {brand.name}
              </h1>
              {brand.domain && (
                <a
                  href={`https://${brand.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white/80 hover:text-white"
                >
                  <Globe className="h-4 w-4" />
                  {brand.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          {brand.description && (
            <p className="mt-4 text-lg opacity-90 max-w-3xl">
              {brand.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-black text-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold">
                {brand.chapters.length}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Chapters
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold">
                {totalMembers}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Ambassadors
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold">
                {totalUpcomingRides}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Upcoming Rides
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold">{totalRides}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Total Rides
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Chapters</h2>
          <Button asChild>
            <Link href={`/brands/${brand.slug}/create-chapter`}>
              <Plus className="h-4 w-4 mr-2" />
              Start a Chapter
            </Link>
          </Button>
        </div>

        {brand.chapters.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No chapters yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to start a {brand.name} chapter in your city.
              </p>
              <Button asChild>
                <Link href={`/brands/${brand.slug}/create-chapter`}>
                  Start a Chapter
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {brand.chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/brands/${brand.slug}/${chapter.slug}`}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        {brand.name} {chapter.name}
                      </CardTitle>
                      {chapter._count.rides > 0 && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: brand.primaryColor || undefined,
                            color: brand.primaryColor ? "white" : undefined,
                          }}
                        >
                          {chapter._count.rides} upcoming
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {chapter.city}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {chapter.memberCount} ambassadors
                      </span>
                      <span className="flex items-center gap-1">
                        <Bike className="h-4 w-4" />
                        {chapter.rideCount} rides
                      </span>
                    </div>

                    {/* Chapter Members */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {chapter.members.slice(0, 4).map((member) => (
                          <Avatar
                            key={member.id}
                            className="h-8 w-8 border-2 border-background"
                          >
                            <AvatarImage
                              src={member.user.image || undefined}
                              alt={member.user.name || ""}
                            />
                            <AvatarFallback className="text-xs">
                              {member.user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {chapter.members.length > 4 && (
                          <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                            +{chapter.members.length - 4}
                          </div>
                        )}
                      </div>
                      {chapter.members.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BadgeCheck className="h-3 w-3 text-blue-500" />
                          {chapter.members.find((m) => m.role === "LEAD")?.user
                            .name || "Lead"}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
