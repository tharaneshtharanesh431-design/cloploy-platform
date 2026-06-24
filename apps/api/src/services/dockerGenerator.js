const templates = {
  'Next.js': `FROM node:20-alpine AS deps\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nEXPOSE 3000\nCMD [\"npm\",\"run\",\"start\"]`,
  React: `FROM node:20-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nFROM nginx:stable-alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD [\"nginx\",\"-g\",\"daemon off;\"]`,
  'Node.js': `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nEXPOSE 5000\nCMD [\"node\",\"server.js\"]`,
  'Spring Boot': `FROM eclipse-temurin:17-jdk AS build\nWORKDIR /app\nCOPY . .\nRUN ./mvnw package -DskipTests\nFROM eclipse-temurin:17-jre\nCOPY --from=build /app/target/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT [\"java\",\"-jar\",\"/app.jar\"]`,
  Python: `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD [\"python\",\"app.py\"]`,
  Go: `FROM golang:1.22-alpine AS build\nWORKDIR /src\nCOPY . .\nRUN go build -o app .\nFROM alpine:3.20\nWORKDIR /app\nCOPY --from=build /src/app .\nEXPOSE 8080\nCMD [\"./app\"]`
};

export function generateDockerArtifacts(framework) {
  return {
    dockerfile: templates[framework] || templates['Node.js'],
    dockerignore: `node_modules\ndist\n.git\n.env\ncoverage\n.terraform\n`
  };
}
