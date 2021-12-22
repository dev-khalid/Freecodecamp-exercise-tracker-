const express = require('express')
const mongodb = require('mongodb'); 
const mongoose = require('mongoose'); 

const app = express()
const cors = require('cors')

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});




///////////////Here goes my code/////////////
app.use(express.json()); 
app.use(express.urlencoded()); 

mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true })

const userSchema = new mongoose.Schema({
  username: 'string'
})
const exerciseSchema = new mongoose.Schema({
  userId: mongoose.ObjectId, 
  description: {
    type: 'string', 
    required: true
  }, 
  duration: {
    type: 'number', 
    required: true
  }, 
  date: { 
    type: 'string',//yyyy-mm-dd
  }
})

const User = mongoose.model('User',userSchema); 
const Exercise = mongoose.model('Exercise',exerciseSchema); 


//1.Get Exercise Data
///api/users/:_id/logs?[from][&to][&limit]
app.get('/api/users/:_id/logs', async(req,res) => { 
  const _id = req.params._id; 
  let form = req.query.form; 
  let to = req.query.to; 
  const limits = parseInt(req.query.limit); 
  let queryString = Exercise.find({userId: req.params._id}); 

  if(form && to) {

    // form = new Date(form).toDateString(); 
    // to = new Date(to).toDateString();    
    queryString.find({ date: { $gte: form, $lte: to } }) 


  } else if( form ) { 

    //form er pore jotogula ache sob dekhabo 
    // form = new Date(form).toDateString();  

    queryString.find({ date: { $gte: form} }) 

  } else if( to ) { 

    //to er ag porjonto jotogula ache sob show korbo 
    // to = new Date(to).toDateString();

    queryString.find({ date: {$lte: to } }) 
 
  }  
 
  let data; 
  if(limits) { 

    data = await queryString.limit(limits).select('description duration date'); 

  } else { 
    data = await queryString.select('description duration date'); 

  }    
  const {username} = await User.findById(req.params._id).select('username -_id');   
  let newData = []; 
  data.forEach(obj=> {
    let x = obj; 
    x.date = new Date(obj.date).toDateString(); 
    newData.push(x); 
  })
  res.json({
    username, 
    count: data.length, 
    log: newData
  })

})




//2.POST /api/users
app.post('/api/users',async (req,res) => { 
  const user = await User.create({username: req.body.username}); 
  res.json({
    username: user.username, 
    _id: user._id
  }); 
  //for testing - 61c27dd2aba3f49fb6a90a30
})
app.get('/api/users',async(req,res)=> { 
  const users = await User.find().select('username _id'); 
  res.json(users); 
})

//3.POST /api/users/:_id/exercises
app.post('/api/users/:_id/exercises',async (req,res) => { 
  const userId = req.params._id; 
  const nD = new Date(); 
  const dateFormer = `${nD.getFullYear()}-${nD.getMonth()+1}-${nD.getDate()} `; 
  const exercise = await Exercise.create({
    userId, 
    description: req.body.description,
    duration: parseInt(req.body.duration), 
    // date: new Date(req.body.date).toDateString()
    date: (req.body.date||dateFormer)
  }); 
  //{"_id":"61c25facf4dcea05eea47e13","username":"khalid hossain akash","date":"Tue Oct 12 2021","duration":10,"description":"aafds"}
  const {username} = await User.findById(userId).select('username -_id');  
  // const convertedDate = new Date(exercise.date).toDateString(); 
  // console.log(exercise.date,convertedDate)
  res.json({
    _id: userId, 
    username,
    date: new Date(exercise.date).toDateString(),
    duration: exercise.duration, 
    description: exercise.description, 
  })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
