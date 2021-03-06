const { Validator } = require('jsonschema');
const util = require('util');


// errors for each error code
// 400
class ValidationError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, ValidationError);
  }
}
// 404
class NotFoundError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, NotFoundError);
  }
}
// 500
class InternalServerError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, InternalServerError);
  }
}


const handleError = async (err) => {
    let statusCode = 500;
    let body = JSON.stringify({ error: 'Error', message: `${err}` });

    if (err && err.constructor) {
        switch (err.constructor) {
	        case ValidationError:
	            statusCode = 400;
	            body = JSON.stringify({ error: 'Validation', message: `${err}` });
	            break;
	        case NotFoundError:
	            statusCode = 404;
	            body = JSON.stringify({ error: 'Not Found', message: `${err}` });
	            break;
	        default:
	            statusCode = 500;
	            body = JSON.stringify({ error: 'Internal Server Error', message: `${err}` });
	            break;
        }
  	}

    let response_object = {
        statusCode,
        body,
        headers: {
        'Content-Type': 'application/json'
        },
    };

    return response_object;
};


let validator = {

	schemas: {
		order: {
            "id": "/Order",
            "type": "object",
            "properties": {
                "customerId": {"type": "string"},
                "items": {"type": "array", "items": { "$ref": "/Item" }}
            },
            "additionalProperties": false,
        },
        item: {
            "id": "/Item",
            "type": "object",
            "properties": {
                "productId": {"type": "string"},
                "quantity": {"type": "integer"}
            },
            "additionalProperties": false,
            "required": ["productId", "quantity"]
        }
	},

	order: {
		getOrDeleteOne: (options) => {

            if(!options.order)
                throw new NotFoundError('No order found with passed order id.');

            // Add customerId to required schema for order
            validator.schemas.order.required = ['customerId'];

            let v = new Validator();
            let result = v.validate(options.body, validator.schemas.order);

            if(result.errors.length)
                throw new ValidationError(result.errors.join(' | '));

            return false;
        },
        getAll: (options) => {
			
            if(!options.order.length)
                throw new NotFoundError('There are no orders in the DB.');

            return false;
        },
        postOne: (options) => {
            // Add customerId to required schema for order
            validator.schemas.order.required = ['customerId'];

            let v = new Validator();
            v.addSchema(validator.schemas.item, '/Item');

            let result = v.validate(options.body, validator.schemas.order);

            if(result.errors.length)
                throw new ValidationError(result.errors.join(' | '));

            return false;
        }
	}

}


module.exports = {
    handleError,
    validator,

    ValidationError,
    NotFoundError,
    InternalServerError,
};
