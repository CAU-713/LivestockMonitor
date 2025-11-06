# Dockerfile for React frontend
FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Set build-time environment variables for Next.js
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# RUN npm run build

EXPOSE 3000
# CMD ["npm", "run", "start"]
CMD ["npm", "run", "dev"]