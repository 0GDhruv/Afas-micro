import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import db from './config/db.js';


dotenv.config();

const app = express();
app.use(express.json());


//connect to db
db.authenticate()
.then(() => console.log('Database connected...'))
.catch((err) => console.log('Error while connecting to database: ' + err));

//routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});