const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
    const {userId} = req.query;
    const where = {};

    if (userId){
    } // TODO: Add handling for userId

    const tags = await prisma.tag.findMany({
        where,
        include: {
            workflowAttributes: true
        }
    });

    res.status(200).json(tags);
})

router.get("/partial", async (req, res) => {
    const {value} = req.query;
    const tags = await prisma.tag.findMany({
        where: {
            name: {
                contains: value.toString(),
            }
        },
        include: {
            workflowAttributes: true
        }
    });

    res.status(200).json(tags);
})

module.exports = router;
