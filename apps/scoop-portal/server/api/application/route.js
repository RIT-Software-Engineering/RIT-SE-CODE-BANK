// import { NextResponse } from "next/server";
import { Router } from "express";
const router = Router();
import { PrismaClient as _PrismaClient } from "../../server/src/generated/prisma/index.js";
const prisma = new _PrismaClient();

router.post("/", async (req, res) => {
  const { name, email, phone, skills, academicStanding, semester, coopsCompleted, resumeUrl } = req.body;
  try {
    const saved = await prisma.application.create({
      data: {
        name,
        email,
        phone,
        skills,
        academicStanding,
        semester,
        coopsCompleted,
        resumeUrl
      }
    });
    res.status(200).json({ message: "Application saved", application: saved });

  } catch (error) {
    console.error("Error saving application:", error);
    return res.status(500).json({ message: "Error saving application", error: error.message });
  }
  
})

export default router;

// export async function POST(request) {
//   const data = await request.json();
//   console.log("Received data:", data);
//   const {name} = data;
//     return NextResponse.json({name});
//   }

//   export async function GET(request) {
//   // const {searchParams} = new URL(request.url);
//   // const name = searchParams.get('name');
//   const obj = Object.fromEntries(request.nextUrl.searchParams);
//     return NextResponse.json(obj);
//   }

// export async function GET() {
//   return NextResponse.json({"message":"API is working"});
// }
