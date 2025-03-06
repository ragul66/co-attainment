import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/user/userModel";
import { verifyToken } from "./userController";

const handleErrorResponse = (res: Response, status: number, message: string) => {
  return res.status(status).json({ message });
};

export const calculateCoattainment = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = await verifyToken(authHeader);
    const { batchId, semId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(batchId) ||
      !mongoose.Types.ObjectId.isValid(semId)
    ) {
      return handleErrorResponse(res, 400, "Invalid IDs provided.");
    }

    const user = await User.findById(userId).lean();
    if (!user) return handleErrorResponse(res, 404, "User not found.");

    const batch = user.batches.find((b: any) => b._id.toString() === batchId);
    if (!batch) return handleErrorResponse(res, 404, "Batch not found.");

    const semester = batch.semlists.find((s: any) => s._id.toString() === semId);
    if (!semester) return handleErrorResponse(res, 404, "Semester not found.");

    const sees = semester.seelist || [];
    const ptLists = semester.ptlists || [];
    const courseLists = semester.courselists || [];

    const studentMap = new Map<string, any>();

    // **Step 1: Initialize student data with SEE scores**
    sees.forEach((see: any) => {
      if (!studentMap.has(see.rollno)) {
        studentMap.set(see.rollno, {
          name: see.name,
          rollno: see.rollno,
          skills: {},
          courses: {},
        });
      }

      const studentData = studentMap.get(see.rollno);
      semester.seetypes.forEach((type: string) => {
        if (!studentData.skills[type]) {
          studentData.skills[type] = { pt: {} };
        }
        studentData.skills[type]["see"] = see.scores[type] || 0;
      });
    });

    // **Step 2: Aggregate PT Data**
    ptLists.forEach((pt: any) => {
      pt.students.forEach((student: any) => {
        if (!studentMap.has(student.rollno)) {
          studentMap.set(student.rollno, {
            name: student.name,
            rollno: student.rollno,
            skills: {},
            courses: {},
          });
        }

        const studentData = studentMap.get(student.rollno);
        Object.entries(student.typemark || {}).forEach(([skill, score]) => {
          if (!studentData.skills[skill]) {
            studentData.skills[skill] = { pt: {} };
          }
          studentData.skills[skill]["pt"][pt.title] = score ?? 0;
        });
      });
    });

    // **Step 3: Calculate CIE (Average of PTs Only)**
    studentMap.forEach((studentData) => {
      Object.keys(studentData.skills).forEach((skill) => {
        const ptScores = Object.values(studentData.skills[skill]["pt"] || {}).filter(
          (score) => typeof score === "number"
        );

        if (ptScores.length > 0) {
          const cieAvg =
            ptScores.reduce((sum, val) => sum + val, 0) / ptScores.length;
          studentData.skills[skill]["CIE"] = Math.round(cieAvg);
        } else {
          studentData.skills[skill]["CIE"] = 0;
        }
      });
    });

    // **Step 4: Aggregate Course Data (Averages)**
    courseLists.forEach((course: any) => {
      course.students.forEach((student: any) => {
        if (!studentMap.has(student.rollno)) {
          studentMap.set(student.rollno, {
            name: student.name,
            rollno: student.rollno,
            skills: {},
            courses: {},
          });
        }

        const studentData = studentMap.get(student.rollno);
        studentData.courses[course.title] = student.average ?? 0;
      });
    });

    // **Step 5: Convert Map to Array and Format Response**
    const result = Array.from(studentMap.values());

    return res.status(200).json({
      message: "Coattainment calculation successful.",
      data: result,
    });
  } catch (error) {
    console.error("Error in calculateCoattainment:", error);
    return handleErrorResponse(res, 500, "Internal Server Error");
  }
};
