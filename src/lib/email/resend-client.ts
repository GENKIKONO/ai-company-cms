import { Resend } from 'resend';

// Initialize Resend client with fallback for build time
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  requestId?: string;
}

interface SendEmailResult {
  success: boolean;
  requestId: string;
  messageId?: string;
  error?: string;
}

export async function sendHtmlEmail({ 
  to, 
  subject, 
  html, 
  requestId = crypto.randomUUID() 
}: SendEmailParams): Promise<SendEmailResult> {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@aiohub.jp';
  
  // Check if API key is available (for runtime)
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') {
    console.warn({
      event: 'auth_email_warning',
      provider: 'resend',
      message: 'RESEND_API_KEY not configured, skipping Resend email',
      requestId,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      requestId,
      error: 'Resend API key not configured'
    };
  }
  
  try {
    console.info({
      event: 'auth_email_sending',
      provider: 'resend',
      to,
      subject,
      requestId,
      timestamp: new Date().toISOString()
    });

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error({
        event: 'auth_email_error',
        provider: 'resend',
        to,
        subject,
        requestId,
        error: error.message || error,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        requestId,
        error: error.message || 'Failed to send email'
      };
    }

    console.info({
      event: 'auth_email_sent',
      provider: 'resend',
      to,
      subject,
      requestId,
      messageId: data?.id,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      requestId,
      messageId: data?.id
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    console.error({
      event: 'auth_email_error',
      provider: 'resend',
      to,
      subject,
      requestId,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      requestId,
      error: errorMessage
    };
  }
}