const express = require('express')
const auth = require('../middleware/auth')
const Task = require('../models/task')

const router = new express.Router()

router.post('/tasks', auth, async (req, res)=>{
    try{
        const task = new Task({
            ...req.body,
            owner: req.user._id,
        })
        await task.save();
        res.status(201).send(task)
    }catch(error){
        console.log(error);
        res.status(400).send()
    }
})

//limit, skip for pagination
router.get('/tasks', auth, async (req, res)=>{
    try {
        //const tasks = await Task.find({owner: req.user._id})
        //or we can do
        const match = {}
        const sort = {}

        if(req.query.sortBy){
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1]==='asc' ? 1 : -1
        }
        if(req.query.completed){
            match.completed = req.query.completed === 'true'
        }
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort,
            }
        })
        res.send(req.user.tasks)
    } catch (error) {
        console.log(error);
        res.status(400).send();
    }
})

router.get('/tasks/:id', auth, async (req, res)=>{
    const _id = req.params.id;
    try {
        const task = await Task.findOne({_id, owner: req.user._id})
        if(task){
            res.send(task);
        } else {
            res.status(404).send('No user with given id was found.')
        }
    } catch (error) {
        res.status(500).send(error);
    }
})

router.patch('/tasks/:id', auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ["description", "completed"]
    const isValidOperation = updates.every((obj)=>{
        return allowedUpdates.includes(obj)
    })

    if(!isValidOperation){
        return res.status(404).send('Invalid update operation')
    }

    try {
        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        //const task = await Task.findById(req.params.id);
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        updates.forEach((obj)=> task[obj] = req.body[obj])
        task.save()
        
        if(task) return res.send(task)
        res.status(404).send('No task found with given id.')
    } catch (error) {
        res.status(500).send(error)
    }
})

router.delete('/tasks/:id', auth, async (req, res)=>{
    try {
        const task = await Task.findOneAndDelete({_id:req.params.id, owner:req.user._id})
        if(task){
            return res.send(task)
        } else{
            res.status(404).send('No task found with the given id')
        }        
    } catch (error) {
        res.status(400).send(error);
    }

})

module.exports = router