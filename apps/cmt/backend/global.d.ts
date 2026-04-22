import { PrismaClient } from '@prisma/client'
import { RequestContext } from 'express';

declare global {
  namespace Express {
    interface Request {
      context: Express.Request.RequestContext
      user: {
        uid: string
      }
      prisma: PrismaClient
    }
  }
}