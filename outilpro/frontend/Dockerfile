# ---- Etape 1 : build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL de l'API injectee au moment du build (valeur publique, pas un secret)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# ID du Pixel Meta (Facebook Ads) -- optionnel : si non fourni, le suivi Facebook Ads
# est simplement desactive (voir src/lib/metaPixel.js), le site fonctionne quand meme.
ARG VITE_FACEBOOK_PIXEL_ID
ENV VITE_FACEBOOK_PIXEL_ID=$VITE_FACEBOOK_PIXEL_ID

RUN npm run build

# ---- Etape 2 : service via Nginx ----
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
