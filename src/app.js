const express = require('express')
const cookieParser = require('cookie-parser')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
 
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(userRouter)
app.use(taskRouter)

module.exports = app