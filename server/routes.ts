import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertCategorySchema, insertPlaylistSchema, 
  insertTrackSchema, insertPlaylistTrackSchema 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";

// Set up file upload with multer
const uploadDir = path.join(process.cwd(), "uploads");

// Create uploads directory if it doesn't exist
const setupUploadDir = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create uploads directory:", err);
  }
};

setupUploadDir();

const storage_config = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only audio files
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.') as any);
    }
  }
});

// Session user middleware
const getUserFromSession = (req: Request, res: Response, next: Function) => {
  // For simplicity, we'll just use a fixed user ID (1) in memory storage
  // In a real app, this would come from a session/auth middleware
  req.user = { id: 1 };
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Apply middleware
  apiRouter.use(getUserFromSession);
  
  // User routes
  apiRouter.get('/users/me', async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return password in response
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user profile' });
    }
  });
  
  apiRouter.patch('/users/me', async (req, res) => {
    try {
      const updateSchema = insertUserSchema
        .partial()
        .omit({ password: true });
      
      const data = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, data);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return password in response
      const { password, ...userData } = updatedUser;
      res.json(userData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to update user profile' });
    }
  });
  
  // Category routes
  apiRouter.get('/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories(req.user.id);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get categories' });
    }
  });
  
  apiRouter.post('/categories', async (req, res) => {
    try {
      const data = insertCategorySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newCategory = await storage.createCategory(data);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to create category' });
    }
  });
  
  apiRouter.patch('/categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      if (category.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this category' });
      }
      
      const updateSchema = insertCategorySchema.partial().omit({ userId: true });
      const data = updateSchema.parse(req.body);
      
      const updatedCategory = await storage.updateCategory(id, data);
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to update category' });
    }
  });
  
  apiRouter.delete('/categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      if (category.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this category' });
      }
      
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete category' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });
  
  // Playlist routes
  apiRouter.get('/playlists', async (req, res) => {
    try {
      const playlists = await storage.getPlaylists(req.user.id);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get playlists' });
    }
  });
  
  apiRouter.get('/playlists/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playlist = await storage.getPlaylistById(id);
      
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
      
      if (playlist.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access this playlist' });
      }
      
      const tracks = await storage.getPlaylistTracks(id);
      
      res.json({
        ...playlist,
        tracks: tracks.map(({ track, position }) => ({
          ...track,
          position
        }))
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get playlist' });
    }
  });
  
  apiRouter.post('/playlists', async (req, res) => {
    try {
      const data = insertPlaylistSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newPlaylist = await storage.createPlaylist(data);
      res.status(201).json(newPlaylist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to create playlist' });
    }
  });
  
  apiRouter.patch('/playlists/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playlist = await storage.getPlaylistById(id);
      
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
      
      if (playlist.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this playlist' });
      }
      
      const updateSchema = insertPlaylistSchema.partial().omit({ userId: true });
      const data = updateSchema.parse(req.body);
      
      const updatedPlaylist = await storage.updatePlaylist(id, data);
      res.json(updatedPlaylist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to update playlist' });
    }
  });
  
  apiRouter.delete('/playlists/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const playlist = await storage.getPlaylistById(id);
      
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
      
      if (playlist.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this playlist' });
      }
      
      const success = await storage.deletePlaylist(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete playlist' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete playlist' });
    }
  });
  
  // Track routes
  apiRouter.get('/tracks', async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      let tracks;
      if (categoryId) {
        const category = await storage.getCategoryById(categoryId);
        if (!category || category.userId !== req.user.id) {
          return res.status(403).json({ message: 'Not authorized to access this category' });
        }
        tracks = await storage.getTracksByCategory(categoryId);
      } else {
        tracks = await storage.getTracks(req.user.id);
      }
      
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get tracks' });
    }
  });
  
  apiRouter.post('/tracks/upload', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file uploaded' });
      }
      
      // Parse and validate other fields
      const trackSchema = insertTrackSchema
        .omit({ filePath: true, userId: true })
        .extend({
          categoryId: z.string().transform(val => parseInt(val)),
          duration: z.string().transform(val => parseInt(val)),
        });
      
      const trackData = trackSchema.parse(req.body);
      
      const track = await storage.createTrack({
        ...trackData,
        userId: req.user.id,
        filePath: req.file.path,
      });
      
      res.status(201).json(track);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to upload track' });
    }
  });
  
  // Serve audio files
  apiRouter.get('/tracks/:id/audio', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const track = await storage.getTrackById(id);
      
      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }
      
      if (track.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access this track' });
      }
      
      res.sendFile(track.filePath);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get track audio' });
    }
  });
  
  // Delete track
  apiRouter.delete('/tracks/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const track = await storage.getTrackById(id);
      
      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }
      
      if (track.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this track' });
      }
      
      const success = await storage.deleteTrack(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete track' });
      }
      
      // Delete the file from disk
      try {
        await fs.unlink(track.filePath);
      } catch (err) {
        console.error('Failed to delete track file:', err);
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete track' });
    }
  });
  
  // PlaylistTrack routes
  apiRouter.post('/playlists/:playlistId/tracks', async (req, res) => {
    try {
      const playlistId = parseInt(req.params.playlistId);
      const playlist = await storage.getPlaylistById(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
      
      if (playlist.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to modify this playlist' });
      }
      
      // Get current highest position
      const playlistTracks = await storage.getPlaylistTracks(playlistId);
      const maxPosition = playlistTracks.length > 0
        ? Math.max(...playlistTracks.map(pt => pt.position))
        : -1;
      
      const data = insertPlaylistTrackSchema.parse({
        playlistId,
        trackId: parseInt(req.body.trackId),
        position: maxPosition + 1
      });
      
      const newPlaylistTrack = await storage.addTrackToPlaylist(data);
      res.status(201).json(newPlaylistTrack);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to add track to playlist' });
    }
  });
  
  apiRouter.delete('/playlists/:playlistId/tracks/:trackId', async (req, res) => {
    try {
      const playlistId = parseInt(req.params.playlistId);
      const trackId = parseInt(req.params.trackId);
      
      const playlist = await storage.getPlaylistById(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
      
      if (playlist.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to modify this playlist' });
      }
      
      const success = await storage.removeTrackFromPlaylist(playlistId, trackId);
      
      if (!success) {
        return res.status(404).json({ message: 'Track not found in playlist' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove track from playlist' });
    }
  });
  
  // Register all routes with /api prefix
  app.use('/api', apiRouter);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
