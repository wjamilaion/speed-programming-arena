-- Speed Bug-Fix Arena — Database Schema & Seed Data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  dev_id VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  time_limit_minutes INT NOT NULL DEFAULT 30,
  starter_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  challenge_id UUID NOT NULL REFERENCES challenges(id),
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'accepted', 'rejected')),
  score INT DEFAULT 0,
  time_taken_seconds INT DEFAULT 0,
  attempt_number INT DEFAULT 1,
  zip_path VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_submissions_user_challenge ON submissions(user_id, challenge_id);
CREATE INDEX idx_submissions_leaderboard ON submissions(challenge_id, status, score DESC, time_taken_seconds ASC);

-- ============================================
-- SEED DATA
-- ============================================

-- Demo user
INSERT INTO users (id, name, dev_id) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Demo Developer', 'DEV-001');

-- Sample challenge: Fix the broken useCounter hook
INSERT INTO challenges (id, title, description, time_limit_minutes, starter_code) VALUES
  ('c0ffee00-1234-5678-9abc-def012345678',
   'Fix the Broken useCounter Hook',
   '## Challenge

You are given a broken React custom hook called `useCounter`. The hook should manage a simple counter with the following features:

- **Initial value**: Accept an optional `initialValue` parameter (default: `0`)
- **increment()**: Increase the count by 1
- **decrement()**: Decrease the count by 1
- **reset()**: Reset the count to the initial value

### Bug Report
Users are reporting that:
1. The increment function is not working correctly
2. The reset function always resets to 0 instead of the initial value
3. The decrement function has no bounds checking (should not go below 0)

### Your Task
Fix all the bugs in the `useCounter` hook so that all tests pass.

### Rules
- Do not change the function signature
- Do not add new dependencies
- Your solution must be in a single file: `src/useCounter.js`',
   30,
   '// useCounter.js — FIX THE BUGS!
import { useState } from "react";

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(0); // Bug 1: ignores initialValue

  const increment = () => {
    setCount(count + 2); // Bug 2: increments by 2 instead of 1
  };

  const decrement = () => {
    setCount(count - 1); // Bug 3: no lower bound check
  };

  const reset = () => {
    setCount(0); // Bug 4: should reset to initialValue
  };

  return { count, increment, decrement, reset };
}');
