import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import db from './config/db.config.js';
import cors from 'cors';


dotenv.config();

const app = express();
app.use(express.json());

// Add CORS middleware
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from frontend-service
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));



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