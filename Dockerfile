# 1. Use Node official image
FROM node:18

# 2. Set working directory inside the container
WORKDIR /app

# 3. Copy package.json first (for caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of your project files into the image
COPY . .

# 6. Expose the port your server runs on
EXPOSE 3000

# 7. Start the server
CMD ["node", "server.js"]
