import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  fullName: text("full_name"),
  avatarColor: text("avatar_color"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  fullName: true,
  avatarColor: true,
});

// Category model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  userId: integer("user_id").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  color: true,
  userId: true,
});

// Playlist model
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).pick({
  name: true,
  userId: true,
  color: true,
  icon: true,
});

// Track model
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id"),
  duration: integer("duration").notNull(), // in seconds
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackSchema = createInsertSchema(tracks).pick({
  name: true,
  userId: true,
  categoryId: true,
  duration: true,
  filePath: true,
});

// PlaylistTrack model (joins playlists and tracks)
export const playlistTracks = pgTable("playlist_tracks", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull(),
  trackId: integer("track_id").notNull(),
  position: integer("position").notNull(),
});

export const insertPlaylistTrackSchema = createInsertSchema(playlistTracks).pick({
  playlistId: true,
  trackId: true,
  position: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;

export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;
