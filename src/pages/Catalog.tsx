import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  BookOpen,
  GraduationCap,
  Package,
  Radio,
  Search,
  ShieldAlert,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "emergency_kit", label: "Kits", icon: Package },
  { key: "sensor_device", label: "Sensors", icon: Radio },
  { key: "safety_gear", label: "Safety gear", icon: ShieldAlert },
  { key: "guide", label: "Guides", icon: BookOpen },
  { key: "training", label: "Training", icon: GraduationCap },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const categoryLabel: Record<string, string> = {
  emergency_kit: "Emergency kit",
  sensor_device: "Sensor device",
  safety_gear: "Safety gear",
  guide: "Guide",
  training: "Training",
};

const categoryChip: Record<string, string> = {
  emergency_kit: "bg-[#ffd02f]",
  sensor_device: "bg-[#7cc4f2]",
  safety_gear: "bg-[#ff5c39] text-white",
  guide: "bg-[#d9e8c5]",
  training: "bg-[#ffd02f]",
};

const categoryIcon: Record<string, typeof Package> = {
  emergency_kit: Package,
  sensor_device: Radio,
  safety_gear: ShieldAlert,
  guide: BookOpen,
  training: GraduationCap,
};

type CatalogItem = {
  _id: Id<"catalogItems">;
  name: string;
  description: string;
  category: string;
  price: number;
  rating?: number;
};

export default function Catalog() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [draft, setDraft] = useState<{
    itemId: Id<"catalogItems">;
    rating: number;
    body: string;
  } | null>(null);

  const items = useQuery(api.catalog.listPublished, {
    search: search || undefined,
    category: category ?? undefined,
  });
  const addReview = useMutation(api.reviews.add);

  const submitReview = async () => {
    if (!draft) return;
    try {
      await addReview({
        itemId: draft.itemId,
        rating: draft.rating,
        body: draft.body,
      });
      toast.success("Review posted — thanks for helping neighbors choose well.");
      setDraft(null);
    } catch {
      toast.error("Sign in to leave a review.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#111111]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#111111]/60">
              Preparedness catalog
              <span className="border-2 border-[#111111] bg-[#d9e8c5] px-1.5 py-0.5 text-[#111111]">
                Be ready
              </span>
            </p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight">
              Gear up before the storm
            </h1>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-fit border-2 border-[#111111] bg-white shadow-[3px_3px_0_0_#111111] hover:shadow-none"
          >
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </header>

        {/* Search + category filters */}
        <div className="sw-card mt-6 bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#111111]/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search kits, sensors, guides…"
              className="border-2 border-[#111111] pl-9 font-semibold"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(category === c.key ? null : c.key)}
                className={`sw-press flex items-center gap-1.5 border-2 border-[#111111] px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-[3px_3px_0_0_#111111] hover:shadow-none ${
                  category === c.key ? "bg-[#111111] text-white" : "bg-white"
                }`}
              >
                <c.icon className="size-3.5" />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Item grid */}
        <section className="mt-6 grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
          {items === undefined && (
            <p className="text-sm font-semibold text-[#111111]/60">Loading catalog…</p>
          )}
          {items !== undefined && items.length === 0 && (
            <p className="text-sm font-semibold text-[#111111]/60">
              Nothing matches that search yet. Try another term or clear the category filter.
            </p>
          )}
          {items?.map((item: CatalogItem) => {
            const Icon = categoryIcon[item.category] ?? Package;
            const rating = item.rating ?? 0;
            const isDraft = draft?.itemId === item._id;
            return (
              <article key={item._id} className="sw-card flex flex-col bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-11 items-center justify-center border-2 border-[#111111] bg-[#f4f2ec]">
                    <Icon className="size-5" />
                  </div>
                  <span
                    className={`border-2 border-[#111111] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${categoryChip[item.category]}`}
                  >
                    {categoryLabel[item.category] ?? item.category}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-black uppercase leading-tight">{item.name}</h3>
                <p className="mt-1 flex-1 text-sm font-semibold leading-relaxed text-[#111111]/75">
                  {item.description}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`size-3.5 ${
                        n <= Math.round(rating)
                          ? "fill-[#ffd02f] text-[#111111]"
                          : "text-[#111111]/30"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[11px] font-bold text-[#111111]/60">
                    {rating ? rating.toFixed(1) : "No reviews yet"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-[#111111]/30 pt-3">
                  <span className="text-lg font-black tabular-nums">
                    ${item.price.toFixed(0)}
                  </span>
                  {isAuthenticated ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-2 border-[#111111] bg-white px-2 shadow-[3px_3px_0_0_#111111] hover:shadow-none"
                      onClick={() =>
                        setDraft(isDraft ? null : { itemId: item._id, rating: 5, body: "" })
                      }
                    >
                      {isDraft ? "Close" : "Review"}
                    </Button>
                  ) : (
                    <Link
                      to="/auth?returnTo=%2Fcatalog"
                      className="border-2 border-[#111111] bg-[#ffd02f] px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-[3px_3px_0_0_#111111]"
                    >
                      Sign in to review
                    </Link>
                  )}
                </div>

                {/* Inline review form */}
                {isDraft && (
                  <div className="mt-3 border-t-2 border-[#111111] pt-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setDraft({ ...draft, rating: n })}
                          className="p-0.5"
                          title={`${n} star${n > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`size-5 ${
                              n <= draft.rating
                                ? "fill-[#ffd02f] text-[#111111]"
                                : "text-[#111111]/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      placeholder="How did it hold up? (optional)"
                      rows={2}
                      className="mt-2 w-full resize-none border-2 border-[#111111] bg-[#f4f2ec] p-2 text-xs font-semibold outline-none focus:bg-white"
                    />
                    <Button
                      size="sm"
                      className="mt-2 w-full border-2 border-[#111111] bg-[#111111] font-black uppercase tracking-wider text-white shadow-[3px_3px_0_0_#ffd02f] hover:shadow-none"
                      onClick={() => void submitReview()}
                    >
                      Post review
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
