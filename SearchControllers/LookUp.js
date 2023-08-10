const express = require("express");
const Router = express.Router();
const axios = require("axios");

Router.post('/ondc-api/lookup',(req,res) => {
    axios.post('https://pilot-gateway-1.beckn.nsdl.co.in/lookup', req.body)
    .then((response) => {
        res.send(response.data[0])
    })
    .catch((err) => {
        res.send(err);
    })
})



module.exports = Router;
l