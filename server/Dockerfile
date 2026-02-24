# Use Node.js 18 slim image as base
FROM node:18-slim

# Install dependencies for both OpenSCAD and native Node modules (like better-sqlite3)
RUN apt-get update && apt-get install -y \
    openscad \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
# We use --build-from-source for better-sqlite3 if needed, 
# although the build tools above should handle standard install
RUN npm install

# Copy all server files
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server
CMD [ "node", "index.js" ]
