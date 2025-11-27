import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin-client';
import { createError, errorToResponse } from '@/lib/error-handler';
import crypto from 'crypto';
import { logger } from '@/lib/log';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const resolvedParams = await params;
  
  try {
    logger.info('[Public Post API Request Started]', {
      requestId,
      slug: resolvedParams.slug,
      postId: resolvedParams.postId,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    const { slug, postId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get('preview') === 'true';

    if (!slug || !postId) {
      throw createError.validation('Organization slug and post ID are required', { slug, postId });
    }

    const supabase = supabaseAdmin;

    // If preview mode, check authentication first
    let allowDraftAccess = false;
    if (isPreview) {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          
          if (!authError && user) {
            // Check if user has access to the organization
            const { data: orgAccess } = await supabase
              .from('organizations')
              .select('id')
              .eq('slug', slug)
              .eq('created_by', user.id)
              .single();
            
            if (orgAccess) {
              allowDraftAccess = true;
            }
          }
        } catch (authErr) {
          logger.debug('Auth check failed for preview', authErr);
        }
      }
    }

    // Get post with appropriate status filter
    const queryStart = Date.now();
    let statusCondition: string | null = 'published';
    if (isPreview && allowDraftAccess) {
      // For authenticated preview, allow any status
      statusCondition = null;
    }

    const query = supabase
      .from('posts')
      .select(`
        id,
        title,
        body,
        status,
        published_at,
        created_at,
        updated_at,
        organization:organizations!organization_id(
          id,
          name,
          slug,
          description,
          url,
          logo_url,
          status
        ),
        author:app_users!created_by(
          id,
          name
        )
      `)
      .eq('id', postId);
    
    if (statusCondition) {
      query.eq('status', statusCondition);
    }

    const { data: post, error } = await query.single() as { data: any | null; error: any };

    const queryDuration = Date.now() - queryStart;
    if (queryDuration > 1000) {
      logger.warn(`[Slow Query] Database query took ${queryDuration}ms for post ${postId}`);
    }

    if (error) {
      throw createError.notFound('Post', postId);
    }

    if (!post) {
      throw createError.notFound('Post', postId);
    }

    // Verify organization slug matches
    if (post.organization?.slug !== slug) {
      throw createError.notFound('Post', postId);
    }

    // Verify organization is also published
    if (post.organization?.status !== 'published') {
      throw createError.notFound('Post', postId);
    }

    // Update post view statistics (non-blocking)
    setTimeout(async () => {
      try {
        const userAgent = request.headers.get('user-agent') || '';
        const referer = request.headers.get('referer') || '';
        
        logger.info(`Post view: ${post.title} (${postId}) - Org: ${post.organization?.name} - UA: ${userAgent} - Ref: ${referer}`);
        
        // TODO: Add view tracking to posts table if needed
        // await supabase
        //   .from('posts')
        //   .update({ view_count: (post.view_count || 0) + 1 })
        //   .eq('id', postId);
      } catch (error) {
        logger.error('Post view tracking error', { data: error instanceof Error ? error : new Error(String(error)) });
      }
    }, 0);

    const duration = Date.now() - startTime;
    
    logger.debug('[Public Post API Success]', {
      method: 'GET',
      path: `/api/public/o/${slug}/posts/${postId}`,
      status: 200,
      duration,
      requestId,
      postId: post.id,
      organizationId: post.organization?.id
    });

    return NextResponse.json({ data: post });

  } catch (error) {
    const duration = Date.now() - startTime;
    const { status, body } = errorToResponse(error, requestId);
    
    logger.error('[Public Post API Error]', {
      method: 'GET',
      path: `/api/public/o/${resolvedParams.slug}/posts/${resolvedParams.postId}`,
      status,
      duration,
      requestId,
      error: body
    });

    return NextResponse.json(body, { status });
  }
}

// HEAD request support for SEO
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { slug, postId } = resolvedParams;
    const supabase = supabaseAdmin;

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        id,
        updated_at,
        organization:organizations!organization_id(slug, status)
      `)
      .eq('id', postId)
      .eq('status', 'published')
      .single() as { data: any | null; error: any };

    if (error || !post || post.organization?.slug !== slug || post.organization?.status !== 'published') {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: {
        'Last-Modified': new Date(post.updated_at).toUTCString(),
        'Cache-Control': 'public, max-age=300, s-maxage=600', // 5分キャッシュ
      }
    });

  } catch (error) {
    logger.error('POST HEAD request error', { data: error instanceof Error ? error : new Error(String(error)) });
    return new Response(null, { status: 500 });
  }
}