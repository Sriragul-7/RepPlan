-- Add date_of_birth column to users table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
