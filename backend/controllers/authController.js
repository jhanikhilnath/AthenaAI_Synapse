import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Athlete from '../models/Athlete.js';

export async function register(req, res) {
  try {
    const { name, email, password, sport, experienceLevel } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const existing = await Athlete.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const athlete = new Athlete({ name, email, password, sport, experienceLevel });
    await athlete.save();
    const token = jwt.sign(
      { id: athlete._id, email: athlete.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
    // send token to client and as httpOnly cookie
    const cookieExpireIn = Number(process.env.JWT_COOKIE_IN) || 90;

    res.cookie('jwt', token, {
      expires: new Date(Date.now() + cookieExpireIn * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    });
    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const athlete = await Athlete.findOne({ email });
    if (!athlete) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await athlete.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: athlete._id, email: athlete.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
    // set httpOnly cookie for convenience
    const cookieExpireIn = Number(process.env.JWT_COOKIE_IN) || 90;

    res.cookie('jwt', token, {
      expires: new Date(Date.now() + cookieExpireIn * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
}
