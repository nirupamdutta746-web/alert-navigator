import { Button } from "@/components/ui/button";
import { api } from "@server/_generated/api";
import type { Id } from "@server/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

type AdminUser = {
  _id: Id<"users">;
  name?: string;
  email?: string;
  role: string;
  isAnonymous: boolean;
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
  const checkins = useQuery(api.community.recentCheckins, isAdmin ? {} : "skip");
  const setRole = useMutation(api.admin.setRole);

  const changeRole = async (userId: Id<"users">, role: string) => {
    try {
      await setRole({ userId, role: role as "admin" | "user" | "member" });
      toast.success("Role updated.");
    } catch {
      toast.error("Only admins can change roles.");
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
            This area manages user roles and live field reports. Ask an existing admin to
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
