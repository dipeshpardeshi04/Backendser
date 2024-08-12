FROM ghcr.io/puppeteer/puppeteer:23.0.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable






FROM node:18

# Install dependencies
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libnss3 \
  lsb-release \
  xdg-utils \
  --no-install-recommends

# Install Chromium
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
  && dpkg -i google-chrome-stable_current_amd64.deb \
  && apt-get -f install -y

# Set up Puppeteer and other dependencies
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# Start the application
CMD ["node", "app.js"]

















# WORKDIR /usr/src/app

# COPY package.json ./
# RUN npm ci
# COPY . .
# CMD [ "node", "app.js" ]
