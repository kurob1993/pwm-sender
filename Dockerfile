# Gunakan image node versi 20 sebagai base image
FROM node:20

# Set working directory di dalam container
WORKDIR /app

# Install Chromium
RUN apt-get update && apt-get install -y chromium

# Salin package.json dan package-lock.json ke dalam working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Set environment variable untuk Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Salin semua file proyek ke dalam working directory
COPY . .

# Perintah untuk menjalankan aplikasi
CMD ["npm", "run", "start"]
