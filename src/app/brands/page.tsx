import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Users, Plus } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

async function getBrands() {
  const brands = await prisma.brand.findMany({
    include: {
      chapters: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          memberCount: true,
          rideCount: true,
        },
      },
      _count: {
        select: {
          chapters: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return brands;
}

export default async function BrandsPage() {
  const brands = await getBrands();

  // Calculate totals across all brands
  const totalChapters = brands.reduce((sum, b) => sum + b._count.chapters, 0);
  const totalMembers = brands.reduce(
    (sum, b) => sum + b.chapters.reduce((s, c) => s + c.memberCount, 0),
    0
  );
  const totalRides = brands.reduce(
    (sum, b) => sum + b.chapters.reduce((s, c) => s + c.rideCount, 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-[#00D26A] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Communities
          </h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Discover cycling communities: brands, clubs, and groups.
            Local chapters, global connections.
          </p>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-black text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold">
                {brands.length}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">
                Communities
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">
                {totalChapters}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">
                Chapters
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">
                {totalMembers}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">
                Ambassadors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">All Communities</h2>
          <Button asChild>
            <Link href="/brands/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Link>
          </Button>
        </div>

        {brands.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No communities yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create a brand, club, or group and start a chapter.
              </p>
              <Button asChild>
                <Link href="/brands/create">Create Your Community</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Link key={brand.id} href={`/brands/${brand.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <BrandLogo
                        logo={brand.logo}
                        logoDark={brand.logoDark}
                        name={brand.name}
                        primaryColor={brand.primaryColor}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{brand.name}</CardTitle>
                        {brand.domain && (
                          <p className="text-sm text-muted-foreground">
                            {brand.domain}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {brand.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {brand.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {brand._count.chapters} chapters
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {brand.chapters.reduce(
                          (sum, c) => sum + c.memberCount,
                          0
                        )}{" "}
                        ambassadors
                      </span>
                    </div>

                    {brand.chapters.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {brand.chapters.slice(0, 4).map((chapter) => (
                          <Badge
                            key={chapter.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {chapter.city}
                          </Badge>
                        ))}
                        {brand.chapters.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{brand.chapters.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
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
