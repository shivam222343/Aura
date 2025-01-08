import jwt from 'jsonwebtoken';

const authentication = async(req, res ,next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if(!token) {
        return res.status(401).json({ message: 'Token is required' });
    }

    jwt.verify(token, 'PSG123', (err, user) => {
            if(err) {
                return res.status(403).json({ message: 'Invalid token' });
            }
            req.user = user;
            next();
})
}

export default authentication;