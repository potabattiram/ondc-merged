

const DeliveryAddressMongooseModel = require('./db/deliveryAddress.js');
const { v4: uuidv4 } = require("uuid");


class DeliveryAddressService {

    /**
    * add delivery address
    * @param {Object} request
    * @param {Object} user
    */
    async deliveryAddress(request = {}, user = {}) {
        try {
            const deliveryAddressSchema = {
                userId: user?.decodedToken?.uid,
                id: uuidv4(),
                descriptor: request?.descriptor,
                gps: request?.gps,
                defaultAddress: true,
                address: request?.address,
            };
            await DeliveryAddressMongooseModel.updateMany(
                { userId: user.decodedToken.uid },
                { defaultAddress: false },
                { maxTimeMS: 20000 } // Increase the timeout to 20 seconds
              );
              

            let storedDeliveryAddress = await DeliveryAddressMongooseModel.create(
                { ...deliveryAddressSchema}
            );
            storedDeliveryAddress = storedDeliveryAddress?.toJSON();

            return {
                id: storedDeliveryAddress?.id,
                descriptor: storedDeliveryAddress?.descriptor,
                gps: storedDeliveryAddress?.gps,
                defaultAddress: storedDeliveryAddress?.defaultAddress,
                address: storedDeliveryAddress?.address
            };
        }
        catch (err) {
            throw err;
        }
    }

    /**
     * get delivery address
     * @param {Object} user
     */
    async onDeliveryAddressDetails(user = {}) {
        try {
            const deliveryAddressDetails = await DeliveryAddressMongooseModel.find({ 
                userId: user?.decodedToken?.uid
            });
            
            return deliveryAddressDetails;
        }
        catch (err) {
            throw err;
        }
    }

    /**
    * add delivery address
    * @param {String} id
    * @param {Object} request
    * @param {String} userId
    */
    async updateDeliveryAddress(id, request = {}, userId) {
        try {
            
            const deliveryAddressSchema = {
                descriptor: request?.descriptor,
                gps: request?.gps,
                defaultAddress: request?.defaultAddress,
                address: request?.address,
            };

            if(request?.defaultAddress)
                await DeliveryAddressMongooseModel.updateMany(
                    { userId: userId },
                    { defaultAddress: false}
                );

            let storedDeliveryAddress = await DeliveryAddressMongooseModel.findOneAndUpdate(
                { id: id },
                { ...deliveryAddressSchema},
                {
                    returnDocument: "after",
                }
            );
            storedDeliveryAddress = storedDeliveryAddress?.toJSON();

            if(storedDeliveryAddress)
                return {
                    id: storedDeliveryAddress?.id,
                    descriptor: storedDeliveryAddress?.descriptor,
                    gps: storedDeliveryAddress?.gps,
                    defaultAddress: storedDeliveryAddress?.defaultAddress,
                    address: storedDeliveryAddress?.address
                };
            else
                return {
                    status: 404,
                    name: 'NO_RECORD_FOUND_ERROR',
                    message: 'Record not found'
                }
        }
        catch (err) {
            throw err;
        }
    }

}

module.exports = DeliveryAddressService;
