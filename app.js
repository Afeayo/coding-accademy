require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const app = express();
const enrollmentRoute = require('./Routes/enrollment');
const connect = require('./dataBase/Db'); 



// connect data base
connect()

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));




//route
app.use('/enrollment', enrollmentRoute);



app.get('/', (req, res)=>{
    res.render('index')
})

app.get('/enrolment', (req, res)=>{
    res.render('enrolment')
})

app.get('/dashboard', (req, res)=>{
    res.render('dashboard')
})


app.get('/course', (req, res)=>{
    res.render('course')
})

app.get('/portal', (req, res)=>{
    res.render('portal')
})



//mongoose.connect('mongodb://localhost:27017/techschoolDB', { useNewUrlParser: true, useUnifiedTopology: true });




app.listen(8000, () => {
    console.log('Server started on port 3000');
});
