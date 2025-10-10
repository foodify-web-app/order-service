# 1. Base image
FROM node:18-alpine

# 2. Set working directory
WORKDIR /

# 3. Copy package.json & install deps
COPY package*.json ./
RUN npm install 

# 4. Copy source code
COPY . .

ENV JWT_SECRET=novaisnow18
# 5. Expose port (match your service port)
EXPOSE 4004

# 6. Start the app
CMD ["npm", "start"]
