import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(), data: text("data").notNull(), version: integer("version").notNull().default(1),
});
export const guestCodes = sqliteTable("guest_codes", {
  id: text("id").primaryKey(), room: text("room").notNull(), digest: text("digest").notNull(), email: text("email").notNull(), expires: integer("expires").notNull(), attempts: integer("attempts").notNull().default(0), sent: integer("sent").notNull().default(0),
});
export const guestSessions = sqliteTable("guest_sessions", {
  digest: text("digest").primaryKey(), room: text("room").notNull(), email: text("email").notNull(), expires: integer("expires").notNull(),
});
export const loginLimits = sqliteTable("login_limits", {
  key: text("key").primaryKey(), window: integer("window").notNull(), attempts: integer("attempts").notNull(),
});
