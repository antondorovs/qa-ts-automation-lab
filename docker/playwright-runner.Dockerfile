FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /qa-learning-lab

COPY package*.json ./
RUN npm ci

COPY . .

ENV BASE_URL=https://example.com
ENV CI=true

CMD ["npm", "test", "--", "--project=chromium"]
