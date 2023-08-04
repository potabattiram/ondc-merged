const express = require('express');
const app = express();
const cors = require('cors');
const initializeFirebase = require('./AuthMiddlewares/lib/firebase/initializeFirebase.js');


initializeFirebase();
app.use(cors({
    origin: '*'
}))

// Importing Controllers
const search = require('./SearchControllers/Search');
// const lookup = require('./SearchControllers/LookUp');
// const Address = require('./AddressControllers/AddressControllers');


app.use(express.json());

app.get('/',(req,res) => {
    res.send('ONDC Working Fine!')
});

app.get('/get/lat-long/:eloc', (req,res) => {
    // axios.get(`https://buyer-app.ondc.org/mmi/api/mmi_place_info?eloc=${req.params.eloc}`)
    // .then((response) => {
    //     res.json(response.data)
    // })
    // .catch((err) => {
    //     res.json(err);
    // })
    res.send({
        eloc: req.params.eloc,
        lat: '12.945630',
        long: '77.586300'
    })
})

app.get('/get/location-data/:lat/:long', (req,res) => {
    axios.get(`https://buyer-app.ondc.org/mmi/api/mmi_latlong_info?lat=${req.params.lat}&long=${req.params.long}`)
    .then((response) => {
        res.json(response.data)
    })
    .catch((err) => {
        res.json(err);
    })
})

app.use(search);
// app.use(lookup);
// app.use(Address);

app.listen(5555, () => {
    console.log('Server is running on Port 5555!')
})