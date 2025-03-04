export const config = {
  path: "/newsapi",
  method: "GET",
  verify: false,
  cors: {
    origins: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://matrix-resource-hub.vercel.app",
      "https://matrix-resource-hub-git-main-aldinsmore-pms-projects.vercel.app"
    ],
    allowedHeaders: ["authorization", "x-client-info", "apikey", "content-type"],
    methods: ["GET", "POST", "OPTIONS"]
  }
}; 