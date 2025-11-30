import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {

    const { token } = req.headers;
    if (!token) {
        return res.status(401).json({ success: false, message: "Not Authorized login Again" });
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        req.body.userId = token_decode.id;
        req.body.role = token_decode.role;
        req.body.sessionId = token_decode.sessionId;
        next();
    } catch (error) {
        if (req.originalUrl.endsWith("refresh-token")) {
            const token_decoded = jwt.decode(token, process.env.JWT_SECRET);
            req.body.sessionId = token_decoded.sessionId;
            req.body.userId = token_decoded.id;
            req.body.role = token_decoded.role;
            next();
        } else {
            res.status(402).json({ success: false, message: `Auth Error , ${error.message}` })
        }
    }
}

export const adminMiddleware = (req, res, next) => {
    const { token } = req.headers;

    if (!token) {
        return res.status(401).json({ success: false, message: "Not Authorized login Again" });
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        req.body.userId = token_decode.id;
        req.body.role = token_decode.role;
        req.body.sessionId = token_decode.sessionId;

        if (token_decode.role == 'customer') {
            return res.status(403).json({ success: false, message: "Admin access only" })
        }
        next();
    } catch (error) {
        res.status(402).json({ success: false, message: `Auth Error , ${error.message}` })
    }
}


