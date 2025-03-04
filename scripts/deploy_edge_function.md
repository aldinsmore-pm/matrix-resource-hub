# Deploying the Updated Edge Function

To fix the CORS issue with the OpenAI News function, follow these steps:

## 1. Install Supabase CLI if not already installed
```bash
npm install -g supabase
```

## 2. Login to Supabase
```bash
supabase login
```

## 3. Deploy the updated function
```bash
cd supabase
supabase functions deploy openai-news --project-ref pmpdgdldvsmjjrhbxlko
```

## 4. Verify CORS configuration is working
After deployment, check the browser console to see if the CORS errors are resolved.

## Alternative: Manual Update in Supabase Dashboard

If you don't want to use the CLI, you can also update the function directly in the Supabase Dashboard:

1. Log in to your Supabase account at [https://app.supabase.com](https://app.supabase.com)
2. Select your project (Matrix Resource Hub)
3. Go to "Edge Functions" in the left sidebar
4. Click on the "openai-news" function
5. Edit the function to include the updated CORS headers
6. Deploy the updated version 