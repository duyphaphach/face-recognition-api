const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'duypeesea',
    password : '12121212',
    database : 'smartbrain'
  }
});

const app = express();

app.use(cors())
app.use(bodyParser.json());

app.get('/', (req, res)=> {
  res.send(database.users);
})

app.post('/signin', (req, res) => {
  const {email, password} = req.body;
  db.select('*')
  .from('users')
  .where('email', '=', email)
  .then(users => {
    if(!users.length){
      res.status(404).json({
          message: "User with email '" +  email + "' does not exist!"
      })
    }
    else{
      db.select('hash')
      .from('login')
      .where('email', '=', email)
      .then(hashes => {
        if(bcrypt.compareSync(password, hashes[0].hash)){
          res.status(200).json({
            message: "Authen passed!",
            user: users[0]
          })
        }
        else{
          res.status(403).json('Wrong email or password!')
        }
      })
    }
  })
})

app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction(tran => {
    tran.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then((emails) => {
      return tran('users')
        .returning('*')
        .insert({
          name: name,
          email: emails[0],
          joined: new Date()
        })
        .then(users => {
          res.status(201).json({
            message: "Successfully create new user!",
            data: {
              username: users[0]
            }
          })
        })
      }
    )
    .then(tran.commit)
    .catch(tran.rollback)
  })
  .catch(err => {
    res.status(400).json(err);
  })
})

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  db.select('*').from('users').where({id})
    .then(users => {
      if (!users.length){
       res.status(404).json({
         message: "User with id '" + id + "' not found!"
       })
     }
      else if (users.length != 1) {
        res.json({
          message: "Failed! Multiple user with same id"
        })
      }
      else{
        res.status(200).json({
          message: "Retrieve data successfully!",
          data: users[0]
        })
      }
    })
})

app.put('/image', (req, res) => {
  const { id } = req.body;
  db('users')
  .returning('entries')
  .where('id', '=', id)
  .increment('entries', 1)
  .then(entries => {
    if (!entries.length){
     res.status(404).json({
       message: "User with id '" + id + "' not found!"
     })
   }
    else{
      res.status(200).json({
        message: "Successfully upload image",
        data: {
          userId: id,
          currentEntries: entries[0]
        }
      })
    }
  })
})

app.listen(3000, ()=> {
  console.log('app is running on port 3000');
})
