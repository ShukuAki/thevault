import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  playlists, type Playlist, type InsertPlaylist,
  tracks, type Track, type InsertTrack,
  playlistTracks, type PlaylistTrack, type InsertPlaylistTrack
} from "@shared/schema";
import path from "path";
import fs from "fs/promises";

// Storage interface with CRUD methods
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Categories
  getCategories(userId: number): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Playlists
  getPlaylists(userId: number): Promise<Playlist[]>;
  getPlaylistById(id: number): Promise<Playlist | undefined>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: number, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;
  
  // Tracks
  getTracks(userId: number): Promise<Track[]>;
  getTrackById(id: number): Promise<Track | undefined>;
  getTracksByCategory(categoryId: number): Promise<Track[]>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrack(id: number, track: Partial<InsertTrack>): Promise<Track | undefined>;
  deleteTrack(id: number): Promise<boolean>;
  
  // PlaylistTracks
  getPlaylistTracks(playlistId: number): Promise<{ track: Track, position: number }[]>;
  addTrackToPlaylist(playlistTrack: InsertPlaylistTrack): Promise<PlaylistTrack>;
  removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<boolean>;
  updateTrackPosition(playlistId: number, trackId: number, newPosition: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private playlists: Map<number, Playlist>;
  private tracks: Map<number, Track>;
  private playlistTracks: Map<number, PlaylistTrack>;
  
  private userId: number;
  private categoryId: number;
  private playlistId: number;
  private trackId: number;
  private playlistTrackId: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.playlists = new Map();
    this.tracks = new Map();
    this.playlistTracks = new Map();
    
    this.userId = 1;
    this.categoryId = 1;
    this.playlistId = 1;
    this.trackId = 1;
    this.playlistTrackId = 1;
    
    // Add default data
    this.initializeDefaultData();
  }
  
  private async initializeDefaultData() {
    // Create a default user
    const defaultUser: InsertUser = {
      username: "user",
      password: "password",
      email: "user@example.com",
      phone: "+1 (555) 123-4567",
      fullName: "Demo User",
      avatarColor: "#1DB954",
    };
    const user = await this.createUser(defaultUser);
    
    // Create default categories
    const categoryData = [
      { name: "Interviews", icon: "ri-mic-fill", color: "#1DB954" },
      { name: "Melodies", icon: "ri-file-music-fill", color: "#2D46B9" },
      { name: "Samples", icon: "ri-sound-module-fill", color: "#F230AA" },
      { name: "Podcasts", icon: "ri-vidicon-fill", color: "#FFC107" },
    ];
    
    for (const data of categoryData) {
      await this.createCategory({ 
        ...data, 
        userId: user.id 
      });
    }
    
    // Create default playlists
    const playlistData = [
      { name: "Morning Reflections", icon: "ri-mic-fill", color: "#2D46B9" },
      { name: "Work Notes", icon: "ri-album-fill", color: "#F230AA" },
      { name: "Song Ideas", icon: "ri-music-fill", color: "#1DB954" },
    ];
    
    for (const data of playlistData) {
      await this.createPlaylist({ 
        ...data, 
        userId: user.id 
      });
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.userId === userId
    );
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...updates };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Playlist methods
  async getPlaylists(userId: number): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(
      (playlist) => playlist.userId === userId
    );
  }
  
  async getPlaylistById(id: number): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }
  
  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const id = this.playlistId++;
    const playlist: Playlist = { ...insertPlaylist, id };
    this.playlists.set(id, playlist);
    return playlist;
  }
  
  async updatePlaylist(id: number, updates: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const playlist = this.playlists.get(id);
    if (!playlist) return undefined;
    
    const updatedPlaylist = { ...playlist, ...updates };
    this.playlists.set(id, updatedPlaylist);
    return updatedPlaylist;
  }
  
  async deletePlaylist(id: number): Promise<boolean> {
    // First delete all playlist tracks
    Array.from(this.playlistTracks.values())
      .filter(pt => pt.playlistId === id)
      .forEach(pt => this.playlistTracks.delete(pt.id));
    
    return this.playlists.delete(id);
  }
  
  // Track methods
  async getTracks(userId: number): Promise<Track[]> {
    return Array.from(this.tracks.values()).filter(
      (track) => track.userId === userId
    );
  }
  
  async getTrackById(id: number): Promise<Track | undefined> {
    return this.tracks.get(id);
  }
  
  async getTracksByCategory(categoryId: number): Promise<Track[]> {
    return Array.from(this.tracks.values()).filter(
      (track) => track.categoryId === categoryId
    );
  }
  
  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const id = this.trackId++;
    const createdAt = new Date();
    const track: Track = { ...insertTrack, id, createdAt };
    this.tracks.set(id, track);
    return track;
  }
  
  async updateTrack(id: number, updates: Partial<InsertTrack>): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    
    const updatedTrack = { ...track, ...updates };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }
  
  async deleteTrack(id: number): Promise<boolean> {
    // Remove from all playlists
    Array.from(this.playlistTracks.values())
      .filter(pt => pt.trackId === id)
      .forEach(pt => this.playlistTracks.delete(pt.id));
    
    return this.tracks.delete(id);
  }
  
  // PlaylistTrack methods
  async getPlaylistTracks(playlistId: number): Promise<{ track: Track, position: number }[]> {
    const playlistTracksArray = Array.from(this.playlistTracks.values())
      .filter(pt => pt.playlistId === playlistId);
    
    const result = playlistTracksArray.map(pt => {
      const track = this.tracks.get(pt.trackId);
      if (!track) throw new Error(`Track not found: ${pt.trackId}`);
      return { track, position: pt.position };
    });
    
    return result.sort((a, b) => a.position - b.position);
  }
  
  async addTrackToPlaylist(insertPlaylistTrack: InsertPlaylistTrack): Promise<PlaylistTrack> {
    // Ensure playlist and track exist
    const playlist = this.playlists.get(insertPlaylistTrack.playlistId);
    if (!playlist) throw new Error(`Playlist not found: ${insertPlaylistTrack.playlistId}`);
    
    const track = this.tracks.get(insertPlaylistTrack.trackId);
    if (!track) throw new Error(`Track not found: ${insertPlaylistTrack.trackId}`);
    
    // Check if track is already in the playlist
    const existing = Array.from(this.playlistTracks.values()).find(
      pt => pt.playlistId === insertPlaylistTrack.playlistId && pt.trackId === insertPlaylistTrack.trackId
    );
    
    if (existing) {
      return existing;
    }
    
    const id = this.playlistTrackId++;
    const playlistTrack: PlaylistTrack = { ...insertPlaylistTrack, id };
    this.playlistTracks.set(id, playlistTrack);
    return playlistTrack;
  }
  
  async removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<boolean> {
    const playlistTrack = Array.from(this.playlistTracks.values()).find(
      pt => pt.playlistId === playlistId && pt.trackId === trackId
    );
    
    if (!playlistTrack) return false;
    return this.playlistTracks.delete(playlistTrack.id);
  }
  
  async updateTrackPosition(playlistId: number, trackId: number, newPosition: number): Promise<boolean> {
    const playlistTrack = Array.from(this.playlistTracks.values()).find(
      pt => pt.playlistId === playlistId && pt.trackId === trackId
    );
    
    if (!playlistTrack) return false;
    
    playlistTrack.position = newPosition;
    this.playlistTracks.set(playlistTrack.id, playlistTrack);
    return true;
  }
}

export const storage = new MemStorage();
