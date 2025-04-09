import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // Maksymalnie 100 żądań na IP
  message: 'Too many requests, please try again later.',
});

export default limiter;
