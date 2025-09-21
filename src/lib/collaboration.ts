'use client';

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CollaborationUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    field?: string;
  };
  lastSeen: number;
}

export interface FieldEdit {
  userId: string;
  userName: string;
  fieldPath: string;
  value: any;
  timestamp: number;
  changeId: string;
}

export interface CollaborationState {
  users: Map<string, CollaborationUser>;
  activeEdits: Map<string, FieldEdit>;
  pendingChanges: FieldEdit[];
}

export class CollaborationService {
  private channel: RealtimeChannel | null = null;
  private organizationId: string | null = null;
  private currentUser: CollaborationUser | null = null;
  private state: CollaborationState = {
    users: new Map(),
    activeEdits: new Map(),
    pendingChanges: [],
  };
  
  private listeners: {
    onUserJoined?: (user: CollaborationUser) => void;
    onUserLeft?: (userId: string) => void;
    onUserUpdated?: (user: CollaborationUser) => void;
    onFieldEdit?: (edit: FieldEdit) => void;
    onConflictDetected?: (conflicts: FieldEdit[]) => void;
    onStateChanged?: (state: CollaborationState) => void;
  } = {};

  private colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16', // lime
  ];

  async joinOrganizationSession(
    organizationId: string,
    user: { id: string; email: string; name: string; avatar_url?: string }
  ): Promise<void> {
    if (this.channel) {
      await this.leaveSession();
    }

    this.organizationId = organizationId;
    this.currentUser = {
      ...user,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      lastSeen: Date.now(),
    };

    // Create channel for this organization
    this.channel = supabase.channel(`organization:${organizationId}:collaboration`, {
      config: {
        presence: { key: user.id },
        broadcast: { self: true },
      },
    });

    // Set up presence tracking
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const newState = this.channel!.presenceState();
        this.updateUsersFromPresence(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const user = newPresences[0] as CollaborationUser;
        this.state.users.set(key, user);
        this.listeners.onUserJoined?.(user);
        this.notifyStateChange();
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        this.state.users.delete(key);
        this.listeners.onUserLeft?.(key);
        this.notifyStateChange();
      });

    // Set up broadcast for real-time edits
    this.channel
      .on('broadcast', { event: 'field_edit' }, ({ payload }) => {
        this.handleFieldEdit(payload as FieldEdit);
      })
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        this.handleCursorMove(payload);
      })
      .on('broadcast', { event: 'field_lock' }, ({ payload }) => {
        this.handleFieldLock(payload);
      })
      .on('broadcast', { event: 'field_unlock' }, ({ payload }) => {
        this.handleFieldUnlock(payload);
      });

    // Subscribe and announce presence
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.channel!.track(this.currentUser!);
      }
    });
  }

  async leaveSession(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack();
      await this.channel.unsubscribe();
      this.channel = null;
    }
    
    this.organizationId = null;
    this.currentUser = null;
    this.state = {
      users: new Map(),
      activeEdits: new Map(),
      pendingChanges: [],
    };
  }

  // Event listeners
  onUserJoined(callback: (user: CollaborationUser) => void) {
    this.listeners.onUserJoined = callback;
  }

  onUserLeft(callback: (userId: string) => void) {
    this.listeners.onUserLeft = callback;
  }

  onUserUpdated(callback: (user: CollaborationUser) => void) {
    this.listeners.onUserUpdated = callback;
  }

  onFieldEdit(callback: (edit: FieldEdit) => void) {
    this.listeners.onFieldEdit = callback;
  }

  onConflictDetected(callback: (conflicts: FieldEdit[]) => void) {
    this.listeners.onConflictDetected = callback;
  }

  onStateChanged(callback: (state: CollaborationState) => void) {
    this.listeners.onStateChanged = callback;
  }

  // Broadcasting methods
  async broadcastFieldEdit(fieldPath: string, value: any): Promise<void> {
    if (!this.channel || !this.currentUser) return;

    const edit: FieldEdit = {
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      fieldPath,
      value,
      timestamp: Date.now(),
      changeId: `${this.currentUser.id}-${Date.now()}-${Math.random()}`,
    };

    await this.channel.send({
      type: 'broadcast',
      event: 'field_edit',
      payload: edit,
    });

    // Add to pending changes for conflict resolution
    this.state.pendingChanges.push(edit);
    this.checkForConflicts();
  }

  async broadcastCursorMove(x: number, y: number, field?: string): Promise<void> {
    if (!this.channel || !this.currentUser) return;

    const updatedUser = {
      ...this.currentUser,
      cursor: { x, y, field },
      lastSeen: Date.now(),
    };

    this.currentUser = updatedUser;
    await this.channel.track(updatedUser);
  }

  async lockField(fieldPath: string): Promise<void> {
    if (!this.channel || !this.currentUser) return;

    await this.channel.send({
      type: 'broadcast',
      event: 'field_lock',
      payload: {
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        fieldPath,
        timestamp: Date.now(),
      },
    });
  }

  async unlockField(fieldPath: string): Promise<void> {
    if (!this.channel || !this.currentUser) return;

    await this.channel.send({
      type: 'broadcast',
      event: 'field_unlock',
      payload: {
        userId: this.currentUser.id,
        fieldPath,
        timestamp: Date.now(),
      },
    });
  }

  // Conflict resolution
  private checkForConflicts(): void {
    const conflicts: FieldEdit[] = [];
    const fieldGroups = new Map<string, FieldEdit[]>();

    // Group changes by field path
    this.state.pendingChanges.forEach(change => {
      if (!fieldGroups.has(change.fieldPath)) {
        fieldGroups.set(change.fieldPath, []);
      }
      fieldGroups.get(change.fieldPath)!.push(change);
    });

    // Check for conflicts in each field
    fieldGroups.forEach((changes, fieldPath) => {
      if (changes.length > 1) {
        // Sort by timestamp to determine order
        changes.sort((a, b) => a.timestamp - b.timestamp);
        
        // Check if changes are from different users within a short time window
        for (let i = 1; i < changes.length; i++) {
          const timeDiff = changes[i].timestamp - changes[i - 1].timestamp;
          if (timeDiff < 2000 && changes[i].userId !== changes[i - 1].userId) {
            conflicts.push(...changes.slice(i - 1, i + 1));
          }
        }
      }
    });

    if (conflicts.length > 0) {
      this.listeners.onConflictDetected?.(conflicts);
    }

    // Clean up old pending changes (older than 5 seconds)
    const now = Date.now();
    this.state.pendingChanges = this.state.pendingChanges.filter(
      change => now - change.timestamp < 5000
    );
  }

  // Event handlers
  private handleFieldEdit(edit: FieldEdit): void {
    // Don't process our own edits
    if (edit.userId === this.currentUser?.id) return;

    this.state.activeEdits.set(edit.fieldPath, edit);
    this.listeners.onFieldEdit?.(edit);
    this.notifyStateChange();

    // Clear the edit after a delay
    setTimeout(() => {
      this.state.activeEdits.delete(edit.fieldPath);
      this.notifyStateChange();
    }, 3000);
  }

  private handleCursorMove(payload: any): void {
    const { userId, cursor } = payload;
    if (userId === this.currentUser?.id) return;

    const user = this.state.users.get(userId);
    if (user) {
      user.cursor = cursor;
      user.lastSeen = Date.now();
      this.state.users.set(userId, user);
      this.listeners.onUserUpdated?.(user);
      this.notifyStateChange();
    }
  }

  private handleFieldLock(payload: any): void {
    const { fieldPath, userId, userName } = payload;
    if (userId === this.currentUser?.id) return;

    const edit: FieldEdit = {
      userId,
      userName,
      fieldPath,
      value: null,
      timestamp: Date.now(),
      changeId: `lock-${userId}-${Date.now()}`,
    };

    this.state.activeEdits.set(fieldPath, edit);
    this.notifyStateChange();
  }

  private handleFieldUnlock(payload: any): void {
    const { fieldPath, userId } = payload;
    if (userId === this.currentUser?.id) return;

    this.state.activeEdits.delete(fieldPath);
    this.notifyStateChange();
  }

  private updateUsersFromPresence(presenceState: any): void {
    this.state.users.clear();
    
    Object.entries(presenceState).forEach(([userId, presences]: [string, any]) => {
      if (presences && presences.length > 0) {
        this.state.users.set(userId, presences[0] as CollaborationUser);
      }
    });
    
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.listeners.onStateChanged?.(this.state);
  }

  // Utility methods
  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  getActiveUsers(): CollaborationUser[] {
    const now = Date.now();
    return Array.from(this.state.users.values()).filter(
      user => now - user.lastSeen < 30000 // Active within last 30 seconds
    );
  }

  isFieldLocked(fieldPath: string): boolean {
    return this.state.activeEdits.has(fieldPath);
  }

  getFieldEditor(fieldPath: string): CollaborationUser | null {
    const edit = this.state.activeEdits.get(fieldPath);
    if (!edit) return null;
    return this.state.users.get(edit.userId) || null;
  }

  getState(): CollaborationState {
    return this.state;
  }
}

export const collaborationService = new CollaborationService();