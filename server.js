import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise


const Thought = mongoose.model('Thought', {
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140
  },
  hearts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// SEEDING FOR ADDING NEW DATA
if (process.env.RESET_DB) {
  console.log('Resetting database')
  const seedDatabase = async () => {
    await Thought.deleteMany({})

    // thought.forEach(() => {
    //   new Thought().save()
    // })
  }
  seedDatabase()
}

// Defines the port the app will run on. Defaults to 8080, but can be 
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// MIDDLEWARES
app.use(cors())
app.use(bodyParser.json())
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavailabale' })
  }
})


//GET A LIST OF THE THOUGHTS IN THE DATABASE. desc = descending order
app.get('/', async (req, res) => {
  const thoughts = await Thought.find().sort({ createdAt: 'desc' }).limit(20).exec()
  res.json(thoughts)
})

//POST/SEND INFORMATION IN A REQUEST
app.post('/', async (req, res) => {
  //Retrieve the information sent by the client to our API endpoint
  const { message, heart } = req.body

  //use our mongoose model to create the database entry
  const thought = new Thought({ message, heart })
  try {
    //Success
    const savedThought = await thought.save()
    res.status(201).json(savedThought)
    console.log(savedThought)
  } catch (err) {
    //Bad request
    res.status(400).json({ message: 'Could not save thought to the database', error: err.errors })
  }
})

app.post('/:thoughtId/like', async (req, res) => {
  const { thoughtId } = req.params
  const thought = await Thought.findById(thoughtId)
  try {
    //Sucess
    thought.hearts += 1
    const likedThought = thought.save()
    res.status(201).json(likedThought)
  } catch (err) {
    // Failed
    res.status(404).json({ message: 'Could not find thought', error: err.errors })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
