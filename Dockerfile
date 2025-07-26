# Stage 1: Build the React application
# Use a specific, stable Node.js version on Alpine for a small, secure base
FROM node:20.12-alpine AS build

WORKDIR /app

# Copy package.json and install all dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production. The output will be in /app/dist.
RUN npm run build

# ---

# Stage 2: Create the final, optimized production image
FROM node:20.12-alpine

WORKDIR /app

# Install 'su-exec', a lightweight and secure tool to switch users.
RUN apk add --no-cache su-exec

# Create the data directory that will be used by the volume.
RUN mkdir -p /data

# Copy production dependency manifests from the build stage.
COPY --from=build /app/package.json /app/package-lock.json* ./

# Install only the production dependencies to keep the final image small.
RUN npm install --omit=dev

# Copy the backend server and the built frontend assets from the 'build' stage.
COPY server.js .
COPY --from=build /app/dist ./dist

# Expose the port the server runs on inside the container.
EXPOSE 3000

# The command to run when the container starts.
# It first changes ownership of the /data volume to the 'node' user.
# Then, it securely switches to the 'node' user to run the server.
# This replaces the need for an external entrypoint.sh script.
CMD ["/bin/sh", "-c", "chown -R node:node /data && exec su-exec node node server.js"]
