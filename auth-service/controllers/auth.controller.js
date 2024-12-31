import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';

export const register = async (req, res) => {
    const {username, password} = req.body;

    try {
        const user = await User.findone({where: {username}});
        if(!user) return res.status(400).json({message: 'User not found'});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({message: 'Invalid credentials'});

        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({token});
    } catch (err){
        res.status(500).json({message: 'Server error',error: err.message});
    }
};