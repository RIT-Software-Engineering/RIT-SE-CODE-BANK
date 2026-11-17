export function isInstructor(user) {
    return Array.isArray(user?.roles) && user.roles.some(role => ["instructor", "professor"].includes(role));
}

export default function requireInstructor(req, res, next) {
    if (!req.user) return res.status(401).json({error: "Not authenticated"});
    if (!isInstructor(req.user)) return res.status(403).json({error: "Instructor access required"});
    next();
}
