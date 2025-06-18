import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import User from '../models/User.js';
import connectDB from './mongodb.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function authenticateToken(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return { error: 'Access token required', status: 401 };
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
}

export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function getUserFromToken(token) {
  try {
    await connectDB();
    const decoded = await verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    throw new Error('Authentication failed');
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    throw new Error('No authorization header');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  return token;
}

export function withAuth(handler) {
  return async function(request, context) {
    try {
      const token = getTokenFromRequest(request);
      const user = await getUserFromToken(token);
      
      // Add user to request object for use in handler
      request.user = user;
      
      return await handler(request, context);
    } catch (error) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  };
}

export async function requireAuth(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    return user;
  } catch (error) {
    throw new Error('Authentication required');
  }
}

// Safe wrapper for API routes that handles authentication at runtime
export function createAuthenticatedHandler(handler) {
  return async function(request, context) {
    try {
      const user = await requireAuth(request);
      // Add user to request object for use in handler
      request.user = user;
      
      return await handler(request, context);
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  };
}

export function createAuthResponse(error, status) {
  return NextResponse.json({ error }, { status });
}

// Function to authenticate user and return either an error response or user data
export async function authenticateUser(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = await getUserFromToken(token);
    return { user };
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}
