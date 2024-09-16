import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (requiredRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Invalid token' });
            }

            // Ensure the token contains the user data, including the role
            if (typeof decoded === 'object' && decoded.hasOwnProperty('id') && decoded.hasOwnProperty('role')) {
                const userRole = (decoded as any).role;

                // Check if the user's role matches one of the required roles for this route
                if (!requiredRoles.includes(userRole)) {
                    return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
                }

                // Attach user info (including role) to the request object for further use in controllers
                (req as any).user = decoded;
                return next();
            } else {
                return res.status(403).json({ message: 'Invalid token structure' });
            }
        });
        return;
    };
};