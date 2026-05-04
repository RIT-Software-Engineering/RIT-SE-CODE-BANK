FROM node:20-alpine
WORKDIR /app

COPY . .

RUN npm ci --workspace=apps/workflow/ecosystem --workspace=apps/cmt/frontend 

RUN npm run --workspace=apps/cmt/frontend build

ARG PORT
ENV PORT=$PORT

EXPOSE 3010

CMD ["npm", "run", "--workspace=apps/cmt/frontend", "start"]
