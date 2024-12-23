export const response = (res, status, message) => {
    return res.status(status).json({ message });
};