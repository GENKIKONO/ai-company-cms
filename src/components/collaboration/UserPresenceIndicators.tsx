'use client';

import { useState, useEffect } from 'react';
import { collaborationService, CollaborationUser } from '@/lib/collaboration';
import { UserIcon, EyeIcon } from '@heroicons/react/24/outline';

interface UserPresenceIndicatorsProps {
  className?: string;
  showCursors?: boolean;
  maxVisibleUsers?: number;
}

export default function UserPresenceIndicators({
  className = '',
  showCursors = true,
  maxVisibleUsers = 8,
}: UserPresenceIndicatorsProps) {
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);

  useEffect(() => {
    const updateUsers = () => {
      setActiveUsers(collaborationService.getActiveUsers());
      setCurrentUser(collaborationService.getCurrentUser());
    };

    updateUsers();

    // Listen for collaboration state changes
    collaborationService.onStateChanged(updateUsers);
    collaborationService.onUserJoined(updateUsers);
    collaborationService.onUserLeft(updateUsers);
    collaborationService.onUserUpdated(updateUsers);

    return () => {
      // Cleanup listeners would go here if supported by the service
    };
  }, []);

  // Filter out current user and get other active users
  const otherUsers = activeUsers.filter(user => user.id !== currentUser?.id);
  const visibleUsers = otherUsers.slice(0, maxVisibleUsers);
  const hiddenUsersCount = Math.max(0, otherUsers.length - maxVisibleUsers);

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <>
      {/* User presence list */}
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          <EyeIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {otherUsers.length}人が閲覧中
          </span>
        </div>
        
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <div
              key={user.id}
              className="relative group"
              title={`${user.name} (${user.email})`}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: user.color }}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              
              {/* Online indicator */}
              <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {user.name}
                <div className="text-gray-300">{user.email}</div>
              </div>
            </div>
          ))}
          
          {hiddenUsersCount > 0 && (
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-md bg-gray-400 flex items-center justify-center text-white text-xs font-medium"
              title={`他${hiddenUsersCount}人`}
            >
              +{hiddenUsersCount}
            </div>
          )}
        </div>
      </div>

      {/* User cursors */}
      {showCursors && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {otherUsers
            .filter(user => user.cursor && user.cursor.x > 0 && user.cursor.y > 0)
            .map((user) => (
              <UserCursor
                key={user.id}
                user={user}
                x={user.cursor!.x}
                y={user.cursor!.y}
                field={user.cursor!.field}
              />
            ))}
        </div>
      )}
    </>
  );
}

interface UserCursorProps {
  user: CollaborationUser;
  x: number;
  y: number;
  field?: string;
}

function UserCursor({ user, x, y, field }: UserCursorProps) {
  return (
    <div
      className="absolute transform -translate-x-1 -translate-y-1 transition-all duration-200 ease-out"
      style={{ left: x, top: y }}
    >
      {/* Cursor pointer */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="drop-shadow-sm"
        style={{ color: user.color }}
      >
        <path
          d="M2 2L14 8L8 10L6 14L2 2Z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* User label */}
      <div
        className="absolute top-4 left-2 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
        {field && (
          <div className="text-xs opacity-80">
            編集中: {field}
          </div>
        )}
      </div>
    </div>
  );
}