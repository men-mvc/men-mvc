import rateLimit from 'express-rate-limit';

export const apiThrottle = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 2 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
