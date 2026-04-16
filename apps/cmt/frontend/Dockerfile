FROM node:20-alpine
WORKDIR /app

COPY . .

RUN npm ci --workspace=apps/workflow/ecosystem --workspace=apps/cmt/frontend

RUN npm run --workspace=apps/workflow/ecosystem build
RUN npm run --workspace=apps/cmt/frontend build

# run only that workspace
CMD ["npm", "run", "--workspace=apps/cmt/frontend", "start"]