const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors({
    origin: '*'
}))

// Importing Controllers
const search = require('./SearchControllers/Search');
const lookup = require('./SearchControllers/LookUp');


app.use(express.json());


app.get('/',(req,res) => {
    res.send('ONDC Working Fine!')
});

app.use(search);
app.use(lookup);

app.listen(5555, () => {
    console.log('Server is running!')
})