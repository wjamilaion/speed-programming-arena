import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../entities/submission.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
  ) { }

  async getTop10(challengeId: string) {
    // Optimized query to get the best score for each unique user for the given challenge.
    // Tie-breaking: Higher Score > Lower Time > Fewer Attempts
    const query = `
      SELECT 
        u.name,
        u.dev_id,
        s.score,
        s.time_taken_seconds,
        s.status,
        RANK() OVER (ORDER BY s.score DESC, s.time_taken_seconds ASC, s.attempt_number ASC) as rank
      FROM (
        SELECT DISTINCT ON (user_id) 
          user_id, score, time_taken_seconds, attempt_number, status
        FROM submissions
        WHERE challenge_id = $1 AND status = 'accepted'
        ORDER BY user_id, score DESC, time_taken_seconds ASC, attempt_number ASC
      ) s
      JOIN users u ON s.user_id = u.id
      ORDER BY rank
      LIMIT 10
    `;

    return this.submissionRepo.query(query, [challengeId]);
  }

  async getUserChallengeStanding(challengeId: string, userId: string) {
    const query = `
      SELECT 
        u.id as user_id,
        u.name,
        u.dev_id,
        s.score,
        s.time_taken_seconds,
        s.status,
        RANK() OVER (ORDER BY s.score DESC, s.time_taken_seconds ASC, s.attempt_number ASC) as rank
      FROM (
        SELECT DISTINCT ON (user_id) 
          user_id, score, time_taken_seconds, attempt_number, status
        FROM submissions
        WHERE challenge_id = $1 AND status = 'accepted'
        ORDER BY user_id, score DESC, time_taken_seconds ASC, attempt_number ASC
      ) s
      JOIN users u ON s.user_id = u.id
    `;

    const results = await this.submissionRepo.query(query, [challengeId]);
    const userStanding = results.find((r: any) => r.user_id === userId || r.dev_id === userId);
    return userStanding || null;
  }

  async getEventTop10(eventId: string) {
    const query = `
      WITH challenge_best AS (
        SELECT DISTINCT ON (user_id, challenge_id)
          user_id, score, time_taken_seconds
        FROM submissions
        WHERE event_id = $1 AND status = 'accepted'
        ORDER BY user_id, challenge_id, score DESC, time_taken_seconds ASC
      )
      SELECT 
        u.name,
        u.dev_id,
        SUM(cb.score) as total_score,
        SUM(cb.time_taken_seconds) as total_time,
        RANK() OVER (ORDER BY SUM(cb.score) DESC, SUM(cb.time_taken_seconds) ASC) as rank
      FROM challenge_best cb
      JOIN users u ON cb.user_id = u.id
      GROUP BY u.id, u.name, u.dev_id
      ORDER BY rank
      LIMIT 10
    `;

    return this.submissionRepo.query(query, [eventId]);
  }

  async getUserEventStanding(eventId: string, userId: string) {
    const query = `
      WITH challenge_best AS (
        SELECT DISTINCT ON (user_id, challenge_id)
          user_id, score, time_taken_seconds
        FROM submissions
        WHERE event_id = $1 AND status = 'accepted'
        ORDER BY user_id, challenge_id, score DESC, time_taken_seconds ASC
      ),
      event_ranks AS (
        SELECT 
          u.id as user_id,
          u.name,
          u.dev_id,
          SUM(cb.score) as total_score,
          SUM(cb.time_taken_seconds) as total_time,
          RANK() OVER (ORDER BY SUM(cb.score) DESC, SUM(cb.time_taken_seconds) ASC) as rank
        FROM challenge_best cb
        JOIN users u ON cb.user_id = u.id
        GROUP BY u.id, u.name, u.dev_id
      )
      SELECT * FROM event_ranks WHERE user_id = $2 OR dev_id = $2
    `;

    const results = await this.submissionRepo.query(query, [eventId, userId]);
    return results[0] || null;
  }
}
