import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { createClient } from 'npm:@insforge/sdk';

export default async function(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const userToken = authHeader ? authHeader.replace('Bearer ', '') : null;

    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
      edgeFunctionToken: userToken
    });

    const body = await req.json();
    const { filename, contentType, base64Data, folder } = body;

    if (!filename || !base64Data) {
      return new Response(JSON.stringify({ error: 'Missing filename or base64Data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const isAvatarUpload = folder === 'avatars' || folder === 'profile';

    // Verify user authentication
    const { data: userData } = await client.auth.getCurrentUser();
    const userId = userData?.user?.id || (userData as any)?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If uploading product catalog assets, verify admin role in admin_users
    if (!isAvatarUpload) {
      const { data: adminRecord } = await client.database
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (!adminRecord || adminRecord.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin privilege required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const r2Endpoint = Deno.env.get('R2_ENDPOINT');
    const r2Bucket = Deno.env.get('R2_BUCKET_NAME');
    const r2AccessKey = Deno.env.get('R2_ACCESS_KEY_ID');
    const r2SecretKey = Deno.env.get('R2_SECRET_ACCESS_KEY');

    if (!r2Endpoint || !r2Bucket || !r2AccessKey || !r2SecretKey) {
      return new Response(JSON.stringify({ error: 'R2 storage credentials not configured on backend' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKey,
        secretAccessKey: r2SecretKey
      }
    });

    const cleanFolder = (folder || 'products').replace(/^\/+|\/+$/g, '');
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFilename = isAvatarUpload 
      ? `user-${userId}-${Date.now()}.${ext}`
      : `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const objectKey = `${cleanFolder}/${cleanFilename}`;

    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    await s3.send(new PutObjectCommand({
      Bucket: r2Bucket,
      Key: objectKey,
      Body: binaryData,
      ContentType: contentType || 'image/jpeg'
    }));

    const publicBase = 'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev';
    const publicUrl = `${publicBase}/${objectKey}`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      key: objectKey
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Upload failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
