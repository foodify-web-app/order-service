FROM node:18-alpine

WORKDIR /app/order-service

# COPY ONLY the package.json first (important!)
COPY order-service/package*.json ./

# Also copy common-utils package.json to install dependencies correctly
COPY common-utils/package*.json ./common-utils/

# Now copy actual service code
COPY order-service .

# Copy common-utils (actual code)
COPY common-utils ./common-utils

# Install dependencies (this prevents idealTree errors)
RUN npm install

EXPOSE 4004

CMD ["npm", "start"]