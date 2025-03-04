// This file configures the debug-webhook function

export const config = {
  path: "/debug-webhook", // Define the endpoint path
  method: "POST", // HTTP method for the function
  verify: false // Disable authentication for testing
}; 