#!/usr/bin/env node

/**
 * Environment Setup Helper
 * 
 * This script helps to set up environment variables and prepare testing environments.
 * Run this script with node: `node setup-env.js [environment]`
 * Where environment is one of: dev, staging, production
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

// Get environment from command line args
const environment = process.argv[2] || 'dev';
const validEnvironments = ['dev', 'staging', 'production'];

if (!validEnvironments.includes(environment)) {
  console.log(`${colors.red}Invalid environment "${environment}". Please use one of: ${validEnvironments.join(', ')}${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.blue}Setting up environment for: ${colors.green}${environment}${colors.reset}\n`);

// File mapping for environments
const fileMapping = {
  dev: '.env.development',
  staging: '.env.staging',
  production: '.env.production'
};

const targetEnvFile = fileMapping[environment];

// Check if target environment file exists
if (!fs.existsSync(targetEnvFile)) {
  console.log(`${colors.yellow}Environment file ${targetEnvFile} not found. Creating from example...${colors.reset}`);
  
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', targetEnvFile);
    console.log(`${colors.green}Created ${targetEnvFile} from .env.example${colors.reset}`);
  } else {
    console.log(`${colors.red}Error: .env.example not found.${colors.reset}`);
    process.exit(1);
  }
}

// Copy to .env.local for development
if (environment === 'dev') {
  fs.copyFileSync(targetEnvFile, '.env.local');
  console.log(`${colors.green}Copied ${targetEnvFile} to .env.local${colors.reset}`);
}

// Helper function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

// Main function
async function setup() {
  console.log(`${colors.blue}Let's configure your ${environment} environment variables...${colors.reset}`);
  
  // Read current environment file
  const envContent = fs.readFileSync(targetEnvFile, 'utf8');
  const envLines = envContent.split('\n');
  const updatedLines = [];
  
  // Process each line
  for (const line of envLines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      updatedLines.push(line);
      continue;
    }
    
    // Check if line contains a variable
    const match = line.match(/^([A-Z_]+)=(.*)/);
    if (match) {
      const varName = match[1];
      const currentValue = match[2];
      
      // Skip if value is already set and not empty
      if (currentValue && currentValue !== '' && !currentValue.includes('your_') && !currentValue.includes('...')) {
        console.log(`${colors.green}${varName} is already set to: ${currentValue}${colors.reset}`);
        updatedLines.push(line);
        continue;
      }
      
      // Prompt for value if not set
      console.log(`${colors.yellow}Setting up ${varName}:${colors.reset}`);
      const newValue = await prompt(`Please enter value for ${varName}: `);
      updatedLines.push(`${varName}=${newValue}`);
    } else {
      updatedLines.push(line);
    }
  }
  
  // Write updated content back to env file
  fs.writeFileSync(targetEnvFile, updatedLines.join('\n'));
  console.log(`\n${colors.green}Environment file ${targetEnvFile} has been updated.${colors.reset}`);
  
  // Additional guidance for Edge Functions
  if (environment === 'staging' || environment === 'production') {
    console.log(`\n${colors.yellow}REMINDER:${colors.reset} Don't forget to set up server-side environment variables in Supabase Dashboard:`);
    console.log(`  - Navigate to Edge Functions > Settings > Environment Variables`);
    console.log(`  - Add the following keys for your ${environment} environment:`);
    console.log(`    • SUPABASE_URL`);
    console.log(`    • SUPABASE_SERVICE_ROLE_KEY`);
    console.log(`    • STRIPE_SECRET_KEY`);
    console.log(`    • STRIPE_WEBHOOK_SECRET`);
  }
  
  // Check Stripe price IDs if staging or production
  if (environment === 'staging' || environment === 'production') {
    console.log(`\n${colors.yellow}IMPORTANT:${colors.reset} Update Stripe price IDs in create-checkout-session function!`);
    
    const checkoutFilePath = path.join('supabase', 'functions', 'create-checkout-session', 'index.ts');
    
    if (fs.existsSync(checkoutFilePath)) {
      const checkoutContent = fs.readFileSync(checkoutFilePath, 'utf8');
      
      if (checkoutContent.includes('price_starter_monthly') || 
          checkoutContent.includes('price_professional_monthly') ||
          checkoutContent.includes('price_enterprise_monthly')) {
        
        console.log(`${colors.red}⚠️ Placeholder Stripe price IDs detected in ${checkoutFilePath}${colors.reset}`);
        console.log(`${colors.yellow}Please replace them with actual Stripe price IDs from your ${environment} Stripe account.${colors.reset}`);
      }
    }
  }
  
  // Testing guidance
  console.log(`\n${colors.blue}Testing Recommendations for ${environment}:${colors.reset}`);
  if (environment === 'dev') {
    console.log('1. Start the app with: npm run dev');
    console.log('2. Test authentication flows with your local setup');
    console.log('3. For subscription testing, you may use the test account function in Login.tsx');
  } else if (environment === 'staging') {
    console.log('1. Deploy Edge Functions to your Supabase staging project');
    console.log('2. Configure Stripe webhook endpoints in the Stripe dashboard');
    console.log('3. Build the app with: npm run build -- --mode staging');
    console.log('4. Test the complete authentication and subscription flows systematically');
  } else {
    console.log('1. Ensure all environment variables are properly set for production');
    console.log('2. Double-check Stripe is in live mode with correct price IDs');
    console.log('3. Verify webhook endpoints are configured for production');
    console.log('4. Build for production: npm run build -- --mode production');
  }
  
  rl.close();
}

// Run setup
setup().catch(err => {
  console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
  rl.close();
  process.exit(1);
}); 