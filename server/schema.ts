import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ===== Alert Navigator: live hazard alerts (flood / cyclone early warning) =====
    hazards: defineTable({
      title: v.string(),
      hazardType: v.union(
        v.literal("flood"),
        v.literal("cyclone"),
        v.literal("heavy_rain"),
        v.literal("storm_surge"),
      ),
      severity: v.union(
        v.literal("advisory"),
        v.literal("watch"),
        v.literal("warning"),
        v.literal("emergency"),
      ),
      message: v.string(),
      issuedAt: v.number(),
      expiresAt: v.number(),
      active: v.boolean(),
    })
      .index("by_active", ["active"])
      .index("by_severity", ["severity"])
      .index("by_expires", ["expiresAt"]),

    // ===== Alert Navigator: relief shelters with capacity + live occupancy =====
    shelters: defineTable({
      name: v.string(),
      lat: v.number(),
      lng: v.number(),
      capacity: v.number(),
      occupancy: v.number(),
      kind: v.union(
        v.literal("school"),
        v.literal("community_hall"),
        v.literal("cyclone_shelter"),
        v.literal("temple"),
        v.literal("stadium"),
      ),
      status: v.union(
        v.literal("open"),
        v.literal("filling"),
        v.literal("full"),
        v.literal("closed"),
      ),
      amenities: v.array(v.string()),
    }).index("by_status", ["status"]),

    // ===== Alert Navigator: evacuation route polylines towards a shelter =====
    evacuationRoutes: defineTable({
      name: v.string(),
      toShelterId: v.id("shelters"),
      path: v.array(v.array(v.number())), // [[lat, lng], ...]
      distanceKm: v.number(),
      status: v.union(
        v.literal("clear"),
        v.literal("congested"),
        v.literal("blocked"),
      ),
      note: v.string(),
    }).index("by_shelter", ["toShelterId"]),

    // ===== Alert Navigator: citizen SOS / I-am-safe check-ins =====
    checkins: defineTable({
      userId: v.id("users"),
      lat: v.number(),
      lng: v.number(),
      status: v.union(
        v.literal("safe"),
        v.literal("evacuating"),
        v.literal("need_help"),
      ),
      note: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_created", ["createdAt"]),

    // ===== Alert Navigator: citizen comments on live hazard alerts =====
    reportComments: defineTable({
      hazardId: v.id("hazards"),
      userId: v.id("users"),
      body: v.string(),
      createdAt: v.number(),
    }).index("by_hazard", ["hazardId"]),

    // ===== Alert Navigator: direct community messages =====
    messages: defineTable({
      fromId: v.id("users"),
      toId: v.id("users"),
      body: v.string(),
      readAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_to", ["toId"])
      .index("by_from", ["fromId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
