const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail, sendCancellationEmail} = require('../emails/account')
const path = require('path')

router.post('/users', async (req, res) => {
    const user = new User(req.body)
 
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.cookie('auth_token', token)
        res.sendFile(path.resolve(__dirname, '..', 'views', 'private.html'))
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.cookie('auth_token', token)
        res.sendFile(path.resolve(__dirname, '..', 'views', 'private.html'))
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res)=>{
    try{
        req.user.tokens = req.user.tokens.forEach(token => {
            return token.token != req.token
        });
        await req.user.save() 
        //console.log(req.user);
        res.send('Logged out succesfully')
    } catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res)=>{
    try{
        req.user.tokens = []
        await req.user.save() 
        //console.log(req.user);
        res.send('Logged out of all devices succesfully')
    } catch(e){
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res)=>{
    res.send(req.user)
})

//FIle uploading
const avatar = multer({
    //dest: 'avatars', //as we are saving the images on our mongodb database
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return callback(new Error('Please upload a image'))
        }
        callback(undefined, true)
    }
})
router.post('/users/me/avatar', auth, avatar.single('avatar'), async (req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({height: 250, width: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send('Image uploaded succesfully.')
}, (error, req, res, next)=>{
    res.status(400).send('Error: '+ error.message)
})

router.delete('/users/me/avatar', auth, async (req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send('Avatar deleted succesfully.')
}, (error, req, res, next)=>{
    res.status(400).send('Error: ' + error.message)
})

router.get('/users/:id/avatar', async (req, res)=>{
    try{
        const user = await User.findById(req.params.id)
        //console.log(user);
        if(!user){
            return new Error('No user found with given credentials.')
        }else if(!user.avatar){
            return new Error('No avatar found for the user.')
        }
        //console.log(user);
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(error){
        console.log(error);
        res.status(400).send(error.message)
    }
})
router.patch('/users/me', auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ["name", "email", "password", "age"]
    const isValidOperation = updates.every((obj)=>{
        return allowedUpdates.includes(obj)
    })

    if(!isValidOperation){
        return res.status(404).send('Invalid update operation')
    }

    try {
        updates.forEach((obj) => req.user[obj] = req.body[obj])
        await req.user.save()
    } catch (error) {
        res.status(500).send(error)
    }
})

router.delete('/users/me', auth, async (req, res)=>{
    try {
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        return res.send(req.user)       
    } catch (error) {
        res.status(400).send(error);
    }

})

module.exports = router