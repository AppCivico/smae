FROM node:lts-alpine as build-stage
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY backend/src/common/ ../backend/src/common/
COPY frontend/ .
ENV VITE_API_URL=/api
ENV VITE_COR_DA_FAIXA_DE_CONSTRUCAO=[{"prefix":"des-smae","color":"#FF00FF"},{"prefix":"hml-smae","color":"#FF00FF"},{"prefix":"smae-demo","color":"#FF00FF"}]
RUN npm run build

FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
ADD frontend/docker/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
