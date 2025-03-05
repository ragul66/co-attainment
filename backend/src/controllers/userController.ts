import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import { User } from '../models/user/userModel';

const SECRET_KEY = process.env.JWT_SECRET as string;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

interface JwtPayload {
  id: string;
}

// Function to verify JWT token and return userId
export async function verifyToken(authHeader?: string): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header is missing or invalid');
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Token is required');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    return decoded.id;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    throw new Error('Invalid or expired token');
  }
}

// API to verify JWT token
export async function verifyTokenApi(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const authHeader = req.headers.authorization;

    await verifyToken(authHeader);

    return res.status(200).json({ message: 'token Valid' });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

const isValidGmail = (email: string): boolean => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return emailPattern.test(email);
};

export const CreateUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, pswd } = req.body;

    if (!email || !isValidGmail(email) || !pswd) {
      return res.status(400).json({
        message: 'Invalid email format. Please use a valid Gmail address.',
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pswd, salt);

    const newUser = new User({ email, pswd: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '1h',
      }
    );

    return res
      .status(201)
      .json({ message: 'User created successfully', token: `Bearer ${token}` });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      message: 'Error creating user',
      error: (error as Error).message,
    });
  }
};

export const loginUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, pswd } = req.body;

    if (!email || !isValidGmail(email) || !pswd) {
      return res.status(400).json({
        message: 'Invalid email format. Please use a valid Gmail address.',
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(pswd, user.pswd);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: '24h',
    });
    return res
      .status(200)
      .json({ message: 'Login successful', token: `Bearer ${token}` });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({
      message: 'Error logging in',
      error: (error as Error).message,
    });
  }
};
