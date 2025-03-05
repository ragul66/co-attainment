import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/user/userModel';
import { CoList } from '../models/course/courselModel';
import { ICoStudent } from '../models/course/coStudentModel';
import { IBatch } from '../models/batch/batchModel';
import { ISemester } from '../models/semester/semesterModel';
import { ICoList } from '../models/course/courselModel';
import { verifyToken } from './userController';

const handleErrorResponse = (
  res: Response,
  status: number,
  message: string
): Response => {
  return res.status(status).json({ message });
};

// Get courses from a semester
export const getCourses = async (req: Request, res: Response) => {
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

    const batch = user.batches.find((batch: IBatch) =>
      batch._id.equals(batchId)
    ) as IBatch; // Explicitly type the batch as IBatch
    if (!batch) return handleErrorResponse(res, 404, 'Batch not found.');

    const semester = batch.semlists.find((sem: ISemester) =>
      sem._id.equals(semId)
    ) as ISemester; // Explicitly type the semester as ISemester
    if (!semester) return handleErrorResponse(res, 404, 'Semester not found.');

    const courses = semester.courselists.map((course: ICoList) => ({
      courseId: course._id,
      title: course.title,
    }));

    return res.status(200).json(courses);
  } catch (error) {
    console.error((error as Error).message);
    return handleErrorResponse(res, 500, 'Internal Server Error');
  }
};

// Get course details
export const getCourseDetails = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = await verifyToken(authHeader);
    const { batchId, semId, coId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(batchId) ||
      !mongoose.Types.ObjectId.isValid(semId) ||
      !mongoose.Types.ObjectId.isValid(coId)
    ) {
      return handleErrorResponse(res, 400, 'Invalid IDs provided.');
    }

    const user = await User.findById(userId);
    if (!user) return handleErrorResponse(res, 404, 'User not found.');

    const batch = user.batches.find((batch: IBatch) =>
      batch._id.equals(batchId)
    ) as IBatch; // Explicitly type the batch as IBatch
    if (!batch) return handleErrorResponse(res, 404, 'Batch not found.');

    const semester = batch.semlists.find((sem: ISemester) =>
      sem._id.equals(semId)
    ) as ISemester; // Explicitly type the semester as ISemester
    if (!semester) return handleErrorResponse(res, 404, 'Semester not found.');

    const course = semester.courselists.find((co: ICoList) =>
      co._id.equals(coId)
    ) as ICoList; // Explicitly type the course as ICo
    if (!course) return handleErrorResponse(res, 404, 'Course not found.');

    return res.status(200).json(course);
  } catch (error) {
    console.error((error as Error).message);
    return handleErrorResponse(res, 500, 'Internal Server Error');
  }
};

// Add a new course list
export const addCourseList = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = await verifyToken(authHeader);
    const { title, batchId, semId, structure } = req.body;

    if (
      !title ||
      !structure ||
      !mongoose.Types.ObjectId.isValid(batchId) ||
      !mongoose.Types.ObjectId.isValid(semId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return handleErrorResponse(res, 400, 'All fields must be provided.');
    }

    const user = await User.findById(userId);
    if (!user) return handleErrorResponse(res, 404, 'User not found.');

    const batch = user.batches.find((batch: IBatch) =>
      batch._id.equals(batchId)
    ) as IBatch;
    if (!batch) return handleErrorResponse(res, 404, 'Batch not found.');

    const sem = batch.semlists.find((sem: ISemester) => sem._id.equals(semId));
    if (!sem) return handleErrorResponse(res, 404, 'Semester not found.');

    const namelist = sem.namelist;

    const students = namelist.map((student) => {
      const scores = new Map<string, number>();
      Object.keys(structure).forEach((row: string) => scores.set(row, 0));

      return {
        rollno: student.rollno,
        name: student.name,
        scores,
      } as ICoStudent;
    });
    const structureMap = new Map<string, number>(
      Object.entries(structure).map(([key, value]) => [key, Number(value)])
    );

    const newCoList = new CoList({
      title,
      structure: structureMap,
      students,
    });
    sem.courselists.push(newCoList);
    await user.save();

    return res.status(201).json(sem);
  } catch (error) {
    console.error((error as Error).message);
    return handleErrorResponse(res, 500, 'Internal Server Error');
  }
};

export const editCourseList = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = await verifyToken(authHeader);
    const { batchId, semId, rollno, coId, scores } = req.body;

    // Validate required fields
    if (
      !mongoose.Types.ObjectId.isValid(batchId) ||
      !mongoose.Types.ObjectId.isValid(semId) ||
      !mongoose.Types.ObjectId.isValid(coId) ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !rollno ||
      !scores ||
      typeof scores !== 'object'
    ) {
      return handleErrorResponse(res, 400, 'Invalid or missing fields.');
    }

    const user = await User.findById(userId);
    if (!user) return handleErrorResponse(res, 404, 'User not found.');

    const batch = user.batches.find((batch) => batch._id.equals(batchId));
    if (!batch) return handleErrorResponse(res, 404, 'Batch not found.');

    const sem = batch.semlists.find((sem) => sem._id.equals(semId));
    if (!sem) return handleErrorResponse(res, 404, 'Semester not found.');

    const course = sem.courselists.find((course) => course._id.equals(coId));
    if (!course) return handleErrorResponse(res, 404, 'Course not found.');

    const student = course.students.find(
      (student) => student.rollno === rollno
    );
    if (!student) return handleErrorResponse(res, 404, 'Student not found.');

    student.scores = scores;

    let totalObtained = 0;
    let totalMaxMarks = 0;

    course.structure.forEach((maxMark, key) => {
      const score =
        typeof scores[key] === 'number'
          ? scores[key]
          : Number(scores[key]) || 0;

      if (maxMark > 0) {
        totalObtained += score;
        totalMaxMarks += maxMark;
      }
    });

    student.average =
      totalMaxMarks > 0
        ? parseFloat(((totalObtained * 100) / totalMaxMarks).toFixed(2))
        : 0;

    await user.save();

    return res
      .status(200)
      .json({ message: 'Course list updated successfully.', semester: sem });
  } catch (error) {
    console.error('Error updating course list:', (error as Error).message);
    return handleErrorResponse(res, 500, 'Internal Server Error');
  }
};

// Delete COlist by ID
export const deleteCourseList = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = await verifyToken(authHeader);
    const { coId, batchId, semId } = req.body;

    if (!coId || !userId || !batchId || !semId) {
      return handleErrorResponse(res, 400, 'Invalid input data');
    }

    const user = await User.findById(userId);
    if (!user) return handleErrorResponse(res, 404, 'User not found.');

    const batch = user.batches.find((batch: IBatch) =>
      batch._id.equals(batchId)
    ) as IBatch; // Explicitly type the batch as IBatch
    if (!batch) return handleErrorResponse(res, 404, 'Batch not found.');

    const sem = batch.semlists.find((sem: ISemester) => sem._id.equals(semId)); // Explicitly typing the semester as ISemester
    if (!sem) return handleErrorResponse(res, 404, 'Semester not found.');

    const coListIndex = sem.courselists.findIndex((list: ICoList) =>
      list._id.equals(coId)
    ); // Explicitly typing the course as ICo
    if (coListIndex === -1)
      return handleErrorResponse(res, 404, 'COlist not found');

    sem.courselists.splice(coListIndex, 1);
    await user.save();

    return res.status(200).json({ message: 'COlist deleted successfully' });
  } catch (error) {
    console.error((error as Error).message);
    return handleErrorResponse(res, 500, 'Internal Server Error');
  }
};
