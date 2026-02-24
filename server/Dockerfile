# Use Node.js 18 slim image as base
FROM node:18-slim

# Install OpenSCAD
# We need to install dependencies first
RUN apt-get update && apt-get install -y \
    openscad \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all server files
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server
CMD [ "node", "index.js" ]
