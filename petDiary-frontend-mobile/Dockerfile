FROM node:20-alpine

WORKDIR /app

# Dependências de sistema
RUN apk add --no-cache git bash

# Copiar manifesto e lock
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Porta do Metro Bundler
EXPOSE 8081

# Iniciar Expo Go em modo lan
CMD ["npx", "expo", "start", "--go", "--host", "lan", "--port", "8081"]
