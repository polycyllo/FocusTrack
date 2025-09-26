import express from "express";
import dotenv from 'dotenv'
import subjectRoutes from './routes/subjectRoutes'
dotenv.config()


const app = express()
app.use(express.json());

//routes
app.use('/api/subject', subjectRoutes)

export default app