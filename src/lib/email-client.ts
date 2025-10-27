'use client';
import { logger } from '@/lib/utils/logger';


// Client-side email utilities for triggering email notifications

export async function triggerWelcomeEmail(email: string, userName: string) {
  try {
    const response = await fetch('/api/emails/welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userName }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send welcome email');
    }

    return { success: true, data };
  } catch (error) {
    logger.error('Error triggering welcome email', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

// Function to call after successful user registration
export async function handleUserRegistrationComplete(user: {
  email: string;
  full_name?: string;
}) {
  try {
    // Trigger welcome email
    const emailResult = await triggerWelcomeEmail(
      user.email, 
      user.full_name || user.email
    );

    if (emailResult.success) {
      logger.debug('Debug', 'Welcome email sent successfully');
    } else {
      logger.warn('Failed to send welcome email', emailResult.error);
    }

    return emailResult;
  } catch (error) {
    logger.error('Error in post-registration process', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

// Email preferences management (for future implementation)
export async function updateEmailPreferences(preferences: {
  marketing: boolean;
  system: boolean;
  billing: boolean;
}) {
  try {
    const response = await fetch('/api/emails/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update email preferences');
    }

    return { success: true, data };
  } catch (error) {
    logger.error('Error updating email preferences', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}