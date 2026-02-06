import express, { Request, Response } from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API REST con Node.js y TypeScript' })
})

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
