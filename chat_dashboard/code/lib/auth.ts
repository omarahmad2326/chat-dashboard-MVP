import { NextApiRequest, NextApiResponse } from 'next';

export interface AuthUser {
  userId: string;
  role: string;
  creatorAccess: string[];
}

// Mock auth middleware - replace with real OAuth in production
export function authMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: Function
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization token',
      },
    });
  }

  const token = authHeader.replace('Bearer ', '');

  // TODO: Replace with real OAuth token validation
  if (token !== 'mock_valid_token_12345') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authorization token',
      },
    });
  }

  // TODO: Fetch real user from token/session
  const user: AuthUser = {
    userId: 'usr_chatter_001',
    role: 'chatter',
    creatorAccess: ['cr_001'],
  };

  (req as any).user = user;
  return handler(req, res);
}
