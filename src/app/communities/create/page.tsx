"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Sparkles, Globe, Building2, Users, UsersRound, Trophy } from "lucide-react";

const COMMUNITY_TYPES = [
  { value: "BRAND", label: "Brand", description: "Commercial cycling brand (Rapha, Straede)", icon: Building2 },
  { value: "CLUB", label: "Club", description: "Cycling club with members", icon: Users },
  { value: "TEAM", label: "Team", description: "Racing or competitive team", icon: Trophy },
  { value: "GROUP", label: "Group", description: "Informal riding group", icon: UsersRound },
] as const;

export default function CreateBrandPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingBrand, setFetchingBrand] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"BRAND" | "CLUB" | "TEAM" | "GROUP">("BRAND");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [brandPreview, setBrandPreview] = useState<{
    logo?: string;
    primaryColor?: string;
  } | null>(null);

  const handleDomainBlur = async () => {
    if (!domain) {
      setBrandPreview(null);
      return;
    }

    // Clean domain
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");

    if (!cleanDomain.includes(".")) {
      return;
    }

    setFetchingBrand(true);
    try {
      // Try to fetch brand preview (this would call Brand.dev)
      // For now, we'll just show the domain was recognized
      setBrandPreview({
        primaryColor: "#00D26A", // Placeholder
      });

      // Auto-fill name from domain if empty
      if (!name) {
        const domainName = cleanDomain.split(".")[0];
        setName(domainName.charAt(0).toUpperCase() + domainName.slice(1));
      }
    } catch {
      console.log("Could not fetch brand preview");
    } finally {
      setFetchingBrand(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          domain: domain.trim() || null,
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create brand");
      }

      const brand = await res.json();
      router.push(`/communities/${brand.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create brand");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#00D26A] text-white py-12">
        <div className="container mx-auto px-4">
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Communities
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">Create Your Community</h1>
          <p className="text-white/80 mt-2">
            Start a brand, club, or group and build local chapters.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Community Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Website/Link Input */}
              <div className="space-y-2">
                <Label htmlFor="domain">
                  Website or Link (optional)
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="domain"
                    placeholder="straede.cc or instagram.com/yourgroup"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onBlur={handleDomainBlur}
                    className="pl-10"
                  />
                  {fetchingBrand && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  If you enter a domain, we&apos;ll try to auto-fetch branding from Brand.dev
                </p>
                {brandPreview && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Sparkles className="h-4 w-4" />
                    Brand recognized! We&apos;ll import your branding automatically.
                  </div>
                )}
              </div>

              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Straede"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>

              {/* Community Type */}
              <div className="space-y-3">
                <Label className="text-base">What type of community is this?</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(value) => setType(value as "BRAND" | "CLUB" | "TEAM" | "GROUP")}
                  className="grid gap-3"
                >
                  {COMMUNITY_TYPES.map((communityType) => (
                    <label
                      key={communityType.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        type === communityType.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value={communityType.value} id={communityType.value} />
                      <communityType.icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{communityType.label}</p>
                        <p className="text-sm text-muted-foreground">{communityType.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description
                  <span className="text-muted-foreground text-sm ml-2">
                    Optional
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell riders about your brand..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
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
                <Button type="submit" disabled={loading || !name.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Community"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>1. Your brand profile is created with your logo and colors</li>
              <li>2. You can create chapters in different cities</li>
              <li>3. Chapter leads and ambassadors get verified badges</li>
              <li>4. Rides created by ambassadors display your brand styling</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
