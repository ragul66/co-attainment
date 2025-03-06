import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/user/userModel';
import { verifyToken } from './userController';

const handleErrorResponse = (
  res: Response,
  status: number,
  message: string
) => {
  return res.status(status).json({ message });
};

export const getSeeHeaders = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = await verifyToken(authHeader);
    const { batchId, semId } = req.params;
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(batchId) ||
      !mongoose.Types.ObjectId.isValid(semId)
    ) {
      return handleErrorResponse(res, 400, 'Invalid IDs provided.');
    }
    const user = await User.findById(userId);
    if (!user) return handleErrorResponse(res, 404, 'User not found.');

    const batch = user.batches.find((b) => (b as any)._id.equals(batchId));

    if (!batch) return handleErrorResponse(res, 404, 'Batch not found.');

    const semester = batch.semlists.find((s) => (s as any)._id.equals(semId));

    if (!semester) return handleErrorResponse(res, 404, 'Semester not found.');

    const sees = semester.seetypes;

    return res.status(200).json(sees);
  } catch (error) {
    return handleErrorResponse(res, 500, 'Internal Server Error');
  }
};

export const getSeeFromSemester = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = await verifyToken(authHeader);
    const { batchId, semId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(batchId) ||
      !mongoose.Types.ObjectId.isValid(semId)
    ) {
      return handleErrorResponse(res, 400, 'Invalid IDs provided.');
    }

    const user = await User.findById(userId);
    if (!user) return handleErrorResponse(res, 404, 'User not found.');

    const batch = user.batches.find((b) => (b as any)._id.equals(batchId));

    if (!batch) return handleErrorResponse(res, 404, 'Batch not found.');

    const semester = batch.semlists.find((s) => (s as any)._id.equals(semId));

    if (!semester) return handleErrorResponse(res, 404, 'Semester not found.');

    const sees = semester.seelist;

    return res.status(200).json(sees);
  } catch (error) {
    return handleErrorResponse(res, 500, 'Internal Server Error');
  }
};

export const addSeetype = async (req: Request, res: Response) => {
  try {
    console.log("Received Request Body:", req.body);

    const authHeader = req.headers.authorization;
    const userId = await verifyToken(authHeader);
    const { courses, batchId, semId } = req.body;

    if (
      !Array.isArray(courses) ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(batchId) ||
      !mongoose.Types.ObjectId.isValid(semId)
    ) {
      return handleErrorResponse(res, 400, "Invalid input data");
    }

    const user = await User.findById(userId);
    if (!user) return handleErrorResponse(res, 404, "User not found.");

    const batch = user.batches.find((b) => (b as any)._id.equals(batchId));
    if (!batch) return handleErrorResponse(res, 404, "Batch not found.");

    const sem = batch.semlists.find((s) => (s as any)._id.equals(semId));
    if (!sem) return handleErrorResponse(res, 404, "Semester not found.");

    sem.seelist = sem.seelist || [];

    console.log(
      "✅ Semester Object Before Update:",
      JSON.stringify(sem, null, 2)
    );

    sem.seetypes = courses;

    const validSet = new Set(courses);

    if (Array.isArray(sem.seelist)) {
      sem.seelist.forEach((student) => {
        if (!(student.scores instanceof Map)) {
          student.scores = new Map(); 
        }

        student.scores.forEach((_, key) => {
          if (!validSet.has(key)) {
            student.scores.delete(key);
          }
        });

        courses.forEach((course) => {
          if (!student.scores.has(course)) {
            student.scores.set(course, 0);
          }
        });
      });
    } else {
      console.warn("⚠️ `seelist` is not an array:", sem.seelist);
    }

    await user.save();

    return res.status(201).json({ message: "SEE type added successfully" });
  } catch (error) {
    console.error("❌ Backend Error:", error);
    return handleErrorResponse(res, 500, "Error creating SEE list");
  }
};
export const updateSeeScores = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = await verifyToken(authHeader);
    const { rollno, scores, semId, batchId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(batchId) ||
      !mongoose.Types.ObjectId.isValid(semId) ||
      !rollno ||
      typeof scores !== "object" ||
      scores === null
    ) {
      return handleErrorResponse(res, 400, "Invalid input data");
    }

    const user = await User.findById(userId);
    if (!user) return handleErrorResponse(res, 404, "User not found.");

    const batch = user.batches.find((b) => (b as any)._id.equals(batchId));
    if (!batch) return handleErrorResponse(res, 404, "Batch not found.");

    const sem = batch.semlists.find((s) => (s as any)._id.equals(semId));
    if (!sem) return handleErrorResponse(res, 404, "Semester not found.");

    const student = sem.seelist.find((s) => s.rollno === rollno);
    if (!student) return handleErrorResponse(res, 404, "Student not found.");

    if (!(student.scores instanceof Map)) {
      student.scores = new Map<string, number>(Object.entries(student.scores || {}));
    }

    for (const [assignment, score] of Object.entries(scores)) {
      if (typeof score !== "number") {
        return handleErrorResponse(res, 400, `Invalid score for ${assignment}`);
      }

      student.scores.set(assignment, score);
    }

    user.markModified("batches");

    await user.save();

    return res.status(200).json({ message: "Student score updated successfully." });
  } catch (error) {
    console.error("Error updating scores:", error);
    return handleErrorResponse(res, 500, "Error updating scores.");
  }
};
