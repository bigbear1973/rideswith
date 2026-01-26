"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, MapPin, Users } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string | null;
}

export default function CreateChapterPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    async function loadBrand() {
      try {
        const res = await fetch(`/api/communities/${slug}`);
        if (!res.ok) {
          throw new Error("Brand not found");
        }
        const data = await res.json();
        setBrand(data);
      } catch {
        setError("Brand not found");
      } finally {
        setLoadingBrand(false);
      }
    }
    loadBrand();
  }, [slug]);

  const handleCityChange = (value: string) => {
    setCity(value);
    // Auto-fill chapter name based on city
    if (value && !name) {
      setName(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          name: name.trim(),
          city: city.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create chapter");
      }

      const chapter = await res.json();
      router.push(`/communities/${brand.slug}/${chapter.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chapter");
    } finally {
      setLoading(false);
    }
  };

  if (loadingBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Community not found</h1>
          <Button asChild variant="outline">
            <Link href="/communities">Back to Communities</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="py-12 text-white"
        style={{ backgroundColor: brand.primaryColor || "#00D26A" }}
      >
        <div className="container mx-auto px-4">
          <Link
            href={`/communities/${brand.slug}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {brand.name}
          </Link>
          <div className="flex items-center gap-4">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-12 w-12 object-contain rounded bg-white p-1"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-white/20 flex items-center justify-center text-xl font-bold">
                {brand.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Start a {brand.name} Chapter
              </h1>
              <p className="text-white/80 mt-1">
                Create a local chapter in your city
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Chapter Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Leipzig"
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground">
                  The city where your chapter will organize rides
                </p>
              </div>

              {/* Chapter Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Chapter Name *
                  <span className="text-muted-foreground text-sm ml-2">
                    Usually the city name
                  </span>
                </Label>
                <Input
                  id="name"
                  placeholder="Leipzig"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground">
                  Will display as &quot;{brand.name} {name || "..."}&quot;
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !name.trim() || !city.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Chapter"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              You&apos;ll be the Chapter Lead
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                - You&apos;ll get a verified badge next to your name
              </li>
              <li>- You can invite other ambassadors to help organize rides</li>
              <li>
                - All rides you create will display {brand.name} branding
              </li>
              <li>- Your chapter will appear on the {brand.name} brand page</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
