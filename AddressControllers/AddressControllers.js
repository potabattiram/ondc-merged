const express = require("express");
const Router = express.Router();
const { authentication } = require('../AuthMiddlewares/middlewares/index');
const DeliveryAddressController = require('./AdditionalMiddlewares/Controller')
const deliveryAddressController = new DeliveryAddressController();

Router.post(
    '/clientApis/v1/delivery_address', 
    authentication(),
    deliveryAddressController.deliveryAddress,
);

Router.get(
    '/clientApis/v1/delivery_address', 
    authentication(), 
    deliveryAddressController.onDeliveryAddressDetails
);



module.exports = Router;