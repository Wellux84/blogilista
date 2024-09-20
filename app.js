const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const config = require('./utils/config')
const express = require('express')
const app = express()
require('express-async-errors')
const cors = require('cors')
const blogsRouter = require('./controllers/blogs')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

app.use(cors())
app.use(express.json())

app.use(middleware.tokenExtractor)

app.use('/api/login', loginRouter)
app.use('/api/users', usersRouter)
app.use('/api/blogs', middleware.userExtractor, blogsRouter)

mongoose.set('strictQuery', false)



mongoose.connect(config.MONGODB_URI)

app.use(cors())
app.use(express.json())
app.use(middleware.requestLogger)


app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)
module.exports = app