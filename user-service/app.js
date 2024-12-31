import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/users.route.js';
import db from './config/db.config.js';

dotenv.config();


const app = express();
app.use(express.json());


//connect to db


db.authenticate()
.then(() => console.log('Database connected...'))
.catch((err) => console.log('Error while connecting to database: ' + err));


//Routes
app.use('/users', userRoutes);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});