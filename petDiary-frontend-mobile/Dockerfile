FROM node:20-alpine

WORKDIR /app

# Dependências de sistema para Expo CLI
RUN apk add --no-cache git bash

# Instalar Expo CLI globalmente
RUN npm install -g expo-cli@latest @expo/ngrok

# Copiar manifesto e lock
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Portas: Metro Bundler (8081), Expo DevTools (19000, 19001, 19002)
EXPOSE 8081 19000 19001 19002

# Iniciar Expo em modo tunnel/lan
CMD ["npx", "expo", "start", "--host", "lan", "--port", "8081"]
