import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';
import schemas from './schemas';

export default defineConfig({
  name: 'default',
  title: 'Your Project Name',
  
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  
  plugins: [deskTool(), visionTool()],
  
  schema: {
    types: schemas,
  },
}); 