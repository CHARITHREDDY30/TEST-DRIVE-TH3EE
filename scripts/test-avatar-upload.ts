import { createClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const baseUrl = process.env.VITE_INSFORGE_URL;
const anonKey = process.env.VITE_INSFORGE_ANON_KEY;

console.log('Testing with baseUrl:', baseUrl);

const client = createClient({
  baseUrl: baseUrl || '',
  accessToken: anonKey || ''
});

async function run() {
  // Test sign in as customer
  const { data, error } = await client.auth.signInWithPassword({
    email: 'charithreddy014@gmail.com',
    password: 'Password123!'
  });

  if (error || !data) {
    console.error('Sign in failed:', error);
    return;
  }

  console.log('Signed in successfully as:', data.user?.id, data.user?.email);

  // Test edge function invocation for avatar upload
  const fakePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  console.log('Invoking r2-upload function...');
  const funcRes = await client.functions.invoke('r2-upload', {
    body: {
      filename: 'test-avatar.png',
      contentType: 'image/png',
      base64Data: fakePngBase64,
      folder: 'avatars'
    }
  });

  console.log('Function result:', JSON.stringify(funcRes, null, 2));

  if (funcRes.data?.url) {
    console.log('Updating customer profile with avatar_url:', funcRes.data.url);
    
    // Update profile
    const profRes = await client.auth.setProfile({
      avatar_url: funcRes.data.url
    });
    console.log('setProfile result:', JSON.stringify(profRes, null, 2));

    // Update customers table
    const custRes = await client.database.from('customers').upsert([{
      id: data.user.id,
      auth_user_id: data.user.id,
      full_name: 'Charith Reddy',
      email: 'charithreddy014@gmail.com',
      avatar_url: funcRes.data.url,
      updated_at: new Date().toISOString()
    }], { onConflict: 'auth_user_id' });
    console.log('customers upsert result:', JSON.stringify(custRes, null, 2));
  }
}

run().catch(console.error);
