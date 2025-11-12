import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CSPReport {
  'document-uri': string;
  referrer: string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  disposition: string;
  'blocked-uri': string;
  'line-number': number;
  'column-number': number;
  'source-file': string;
  'status-code': number;
  'script-sample': string;
}

interface CSPReportWrapper {
  'csp-report': CSPReport;
}

function sanitizeCSPReport(report: CSPReport): Partial<CSPReport> {
  // Remove potentially sensitive information
  const sanitized = { ...report };
  
  // Mask user data in URIs
  if (sanitized['document-uri']) {
    sanitized['document-uri'] = sanitized['document-uri'].replace(/[?&](token|id|user)=[^&]*/gi, '$1=[REDACTED]');
  }
  
  if (sanitized['blocked-uri']) {
    sanitized['blocked-uri'] = sanitized['blocked-uri'].replace(/[?&](token|id|user)=[^&]*/gi, '$1=[REDACTED]');
  }
  
  // Limit script sample length
  if (sanitized['script-sample'] && sanitized['script-sample'].length > 100) {
    sanitized['script-sample'] = sanitized['script-sample'].substring(0, 100) + '...';
  }
  
  return sanitized;
}

function getViolationSeverity(violatedDirective: string): 'info' | 'warn' | 'error' {
  // Categorize CSP violations by severity
  if (violatedDirective.includes('script-src')) {
    return 'error'; // Script violations are critical
  }
  
  if (violatedDirective.includes('style-src') || violatedDirective.includes('img-src')) {
    return 'warn'; // Style/image violations are warnings
  }
  
  return 'info'; // Other violations are informational
}

export async function POST(request: NextRequest) {
  try {
    // Parse CSP report
    const body = await request.json() as CSPReportWrapper;
    const cspReport = body['csp-report'];
    
    if (!cspReport) {
      return NextResponse.json({ error: 'Invalid CSP report format' }, { status: 400 });
    }
    
    // Sanitize the report
    const sanitizedReport = sanitizeCSPReport(cspReport);
    
    // Determine severity
    const severity = getViolationSeverity(cspReport['violated-directive'] || '');
    
    // Log the violation
    const logMessage = `CSP violation: ${cspReport['violated-directive']}`;
    const logContext = {
      component: 'csp-report',
      type: 'security_violation',
      violation: {
        directive: cspReport['violated-directive'],
        effectiveDirective: cspReport['effective-directive'],
        blockedUri: sanitizedReport['blocked-uri'],
        documentUri: sanitizedReport['document-uri'],
        sourceFile: cspReport['source-file'],
        lineNumber: cspReport['line-number'],
        columnNumber: cspReport['column-number'],
        disposition: cspReport.disposition
      },
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || 'unknown'
    };
    
    // Log based on severity
    switch (severity) {
      case 'error':
        logger.error(logMessage, logContext);
        break;
      case 'warn':
        logger.warn(logMessage, logContext);
        break;
      default:
        logger.info(logMessage, logContext);
        break;
    }
    
    // For critical violations, you might want to trigger alerts
    if (severity === 'error') {
      // TODO: Integrate with alerting system when available
      logger.error('Critical CSP violation detected', {
        ...logContext,
        alertRequired: true
      });
    }
    
    return NextResponse.json({ status: 'reported' }, { status: 200 });
    
  } catch (error) {
    logger.error('Failed to process CSP report', {
      component: 'csp-report',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle GET requests for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'CSP report endpoint active',
    timestamp: new Date().toISOString()
  });
}