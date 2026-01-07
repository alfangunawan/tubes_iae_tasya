FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 4001

CMD ["npm", "start"]
