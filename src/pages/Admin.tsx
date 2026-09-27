import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  Package,
  ShieldCheck,
  Siren,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type AdminUser = {
  _id: Id<"users">;
  name?: string;
  email?: string;
  role: string;
  isAnonymous: boolean;
};

type CatalogItem = {
  _id: Id<"catalogItems">;
  name: string;
  description: string;
  category: string;
  price: number;
  rating?: number;
  published: boolean;
};

type CheckinRow = {
  _id: Id<"checkins">;
  author: string;
  status: string;
  note?: string;
  createdAt: number;
};

const statusChip: Record<string, string> = {
  safe: "bg-[#d9e8c5]",
  evacuating: "bg-[#ffd02f]",
  need_help: "bg-[#ff5c39] text-white",
};

export default function Admin() {
  const isAdmin = useQuery(api.admin.isAdmin);
  const users = useQuery(api.admin.listUsers, isAdmin ? {} : "skip");
  const catalog = useQuery(api.catalog.listAll, isAdmin ? {} : "skip");
  const checkins = useQuery(api.community.recentCheckins, isAdmin ? {} : "skip");
  const setRole = useMutation(api.admin.setRole);
  const upsertItem = useMutation(api.catalog.upsert);
  const removeItem = useMutation(api.catalog.remove);

  const emptyDraft = {
    name: "",
    description: "",
    category: "emergency_kit" as
      | "emergency_kit"
      | "sensor_device"
      | "safety_gear"
      | "guide"
      | "training",
    price: "29",
    published: true,
  };
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<Id<"catalogItems"> | null>(null);
  const [saving, setSaving] = useState(false);

  const saveItem = async () => {
    setSaving(true);
    try {
      await upsertItem({
        id: editingId ?? undefined,
        name: draft.name.trim(),
        description: draft.description.trim(),
        category: draft.category,
        price: Number(draft.price) || 0,
        published: draft.published,
      });
      toast.success(editingId ? "Item updated." : "Item added to the catalog.");
      setDraft(emptyDraft);
      setEditingId(null);
    } catch {
      toast.error("Could not save the item. Are you an admin?");
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (userId: Id<"users">, role: string) => {
    try {
      await setRole({ userId, role: role as "admin" | "user" | "member" });
      toast.success("Role updated.");
    } catch {
      toast.error("Only admins can change roles.");
    }
  };

  const deleteItem = async (id: Id<"catalogItems">) => {
    try {
      await removeItem({ id });
      toast.success("Item removed.");
    } catch {
      toast.error("Could not remove the item.");
    }
  };

  if (isAdmin === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2ec] p-6 text-[#111111]">
        <div className="sw-card max-w-md bg-white p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center border-2 border-[#111111] bg-[#ff5c39] text-white">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="mt-4 text-xl font-black uppercase tracking-tight">
            Admin access required
          </h1>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#111111]/70">
            This area manages users, the catalog and live field reports. Ask an existing admin to
            grant your account the admin role.
          </p>
          <Button
            asChild
            className="mt-5 border-2 border-[#111111] bg-[#111111] font-black uppercase tracking-wider text-white shadow-[3px_3px_0_0_#ffd02f] hover:shadow-none"
          >
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#111111]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#111111]/60">
              Admin area
              <span className="border-2 border-[#111111] bg-[#ff5c39] px-1.5 py-0.5 text-white">
                Restricted
              </span>
            </p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight">
              Operations console
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

        {isAdmin === undefined && (
          <p className="mt-6 text-sm font-semibold text-[#111111]/60">Checking access…</p>
        )}

        {isAdmin === true && (
          <div className="mt-6 space-y-6 pb-12">
            {/* Users & roles */}
            <section className="sw-card bg-white p-0">
              <div className="flex items-center gap-2 border-b-2 border-[#111111] bg-[#7cc4f2] px-4 py-2.5">
                <Users className="size-4" />
                <p className="text-sm font-black uppercase tracking-widest">Users &amp; roles</p>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#111111]/60">
                  {users?.length ?? 0} accounts
                </span>
              </div>
              <div className="divide-y-2 divide-[#111111]/10">
                {users?.map((u) => (
                  <div key={u._id} className="flex flex-wrap items-center gap-3 p-3">
                    <div className="flex size-8 items-center justify-center border-2 border-[#111111] bg-[#f4f2ec] text-[10px] font-black uppercase">
                      {(u.name ?? u.email ?? "?").slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{u.name ?? u.email ?? "Anonymous"}</p>
                      <p className="truncate text-[11px] font-semibold text-[#111111]/60">
                        {u.email ?? "guest account"}
                        {u.isAnonymous ? " · guest" : ""}
                      </p>
                    </div>
                    <span
                      className={`border-2 border-[#111111] px-1.5 py-0.5 text-[10px] font-black uppercase ${
                        u.role === "admin" ? "bg-[#ff5c39] text-white" : "bg-[#d9e8c5]"
                      }`}
                    >
                      {u.role}
                    </span>
                    {u.role === "admin" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-2 border-[#111111] bg-white px-2 shadow-[3px_3px_0_0_#111111] hover:shadow-none"
                        onClick={() => void changeRole(u._id, "user")}
                      >
                        Demote
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-2 border-[#111111] bg-white px-2 shadow-[3px_3px_0_0_#111111] hover:shadow-none"
                        onClick={() => void changeRole(u._id, "admin")}
                      >
                        Make admin
                      </Button>
                    )}
                  </div>
                ))}
                {users !== undefined && users.length === 0 && (
                  <p className="p-3 text-xs font-semibold text-[#111111]/60">No users yet.</p>
                )}
              </div>
            </section>

            {/* Catalog manager */}
            <section className="sw-card bg-white p-0">
              <div className="flex items-center gap-2 border-b-2 border-[#111111] bg-[#ffd02f] px-4 py-2.5">
                <Package className="size-4" />
                <p className="text-sm font-black uppercase tracking-widest">Catalog manager</p>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#111111]/60">
                  {catalog?.length ?? 0} items
                </span>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[360px_1fr]">
                {/* Editor */}
                <div className="sw-flat bg-[#f4f2ec] p-3">
                  <p className="text-xs font-black uppercase tracking-wider">
                    {editingId ? "Edit item" : "New item"}
                  </p>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Item name"
                    className="mt-2 border-2 border-[#111111] bg-white font-semibold"
                  />
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="What it is and why it matters in a flood or cyclone."
                    rows={3}
                    className="mt-2 w-full resize-none border-2 border-[#111111] bg-white p-2 text-xs font-semibold outline-none"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select
                      value={draft.category}
                      onChange={(e) =>
                        setDraft({ ...draft, category: e.target.value as typeof draft.category })
                      }
                      className="border-2 border-[#111111] bg-white px-2 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="emergency_kit">Emergency kit</option>
                      <option value="sensor_device">Sensor device</option>
                      <option value="safety_gear">Safety gear</option>
                      <option value="guide">Guide</option>
                      <option value="training">Training</option>
                    </select>
                    <Input
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      inputMode="decimal"
                      className="border-2 border-[#111111] bg-white font-semibold"
                    />
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={draft.published}
                      onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                      className="size-4 accent-[#111111]"
                    />
                    Published
                  </label>
                  <div className="mt-3 flex gap-2">
                    <Button
                      disabled={saving || !draft.name.trim()}
                      className="flex-1 border-2 border-[#111111] bg-[#111111] font-black uppercase tracking-wider text-white shadow-[3px_3px_0_0_#ffd02f] hover:shadow-none"
                      onClick={() => void saveItem()}
                    >
                      {editingId ? "Save changes" : "Add item"}
                    </Button>
                    {editingId && (
                      <Button
                        variant="outline"
                        className="border-2 border-[#111111] bg-white shadow-[3px_3px_0_0_#111111] hover:shadow-none"
                        onClick={() => {
                          setEditingId(null);
                          setDraft(emptyDraft);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Item list */}
                <div className="divide-y-2 divide-[#111111]/10">
                  {catalog?.map((i) => (
                    <div key={i._id} className="flex flex-wrap items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{i.name}</p>
                        <p className="truncate text-[11px] font-semibold text-[#111111]/60">
                          {i.category.replace(/_/g, " ")} · ${i.price.toFixed(0)} ·{" "}
                          {i.published ? "published" : "draft"}
                        </p>
                      </div>
                      <span
                        className={`border-2 border-[#111111] px-1.5 py-0.5 text-[10px] font-black uppercase ${
                          i.published ? "bg-[#d9e8c5]" : "bg-[#9a9a9a] text-white"
                        }`}
                      >
                        {i.published ? "Live" : "Draft"}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-2 border-[#111111] bg-white px-2 shadow-[3px_3px_0_0_#111111] hover:shadow-none"
                        onClick={() => {
                          setEditingId(i._id);
                          setDraft({
                            name: i.name,
                            description: i.description,
                            category: i.category as typeof draft.category,
                            price: String(i.price),
                            published: i.published,
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-2 border-[#111111] bg-white px-2 text-[#ff5c39] shadow-[3px_3px_0_0_#111111] hover:shadow-none"
                        onClick={() => void deleteItem(i._id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  {catalog !== undefined && catalog.length === 0 && (
                    <p className="p-3 text-xs font-semibold text-[#111111]/60">
                      Catalog is empty — add the first item.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Check-in monitor */}
            <section className="sw-card bg-white p-0">
              <div className="flex items-center gap-2 border-b-2 border-[#111111] bg-[#ff5c39] px-4 py-2.5 text-white">
                <Siren className="size-4" />
                <p className="text-sm font-black uppercase tracking-widest">Live check-in monitor</p>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-white/70">
                  latest 50
                </span>
              </div>
              <div className="divide-y-2 divide-[#111111]/10">
                {checkins?.map((c) => (
                  <div key={c._id} className="flex flex-wrap items-center gap-3 p-3">
                    <span
                      className={`border-2 border-[#111111] px-1.5 py-0.5 text-[10px] font-black uppercase ${statusChip[c.status]}`}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                    <p className="text-sm font-bold">{c.author}</p>
                    <p className="text-[11px] font-semibold text-[#111111]/60">
                      {new Date(c.createdAt).toLocaleTimeString()} · pin at {c.lat.toFixed(3)},{" "}
                      {c.lng.toFixed(3)}
                    </p>
                  </div>
                ))}
                {checkins !== undefined && checkins.length === 0 && (
                  <p className="p-3 text-xs font-semibold text-[#111111]/60">
                    No check-ins yet. Citizen SOS reports will appear here in real time.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
