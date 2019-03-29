'use strict';
const Promise = require('bluebird');
global.Promise = Promise;
const serverless = require('serverless-http');
const requestPromise = require('request-promise');
const express = require('express');
const bodyParser = require('body-parser');
const { Validator } = require('jsonschema');
const uuid = require('uuid');
const moment = require('moment');
const loki = require('lokijs');
const util = require('util');
const _ = require('lodash');
const {
    handleError,
    validator,
} = require('../utils');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

var db = new loki('orders.json')
var orders = db.addCollection('orders')


app.get('/order/:id', async (req, res) => {

    try {
    	
        let order = await orders.findOne({ 'id': req.body.customerId , 'deleted_at': null });

        // Validate the request
        await validator.order.getOrDeleteOne({ order });

        res.status(200).json({ 
            success : true, 
            data: order
        });

    } catch (error) {
        const err = await handleError(error);
        res.status(err.statusCode).json(JSON.parse(err.body));
    }
});


app.get('/orders', async (req, res) => {

    try {

        let order = await orders.find({ 'deleted_at': null });

        // Validate the request
        await validator.order.getAll({ order });

        res.status(200).json({ 
            success : true, 
            data: order
        });

    } catch (error) {
        const err = await handleError(error);
        res.status(err.statusCode).json(JSON.parse(err.body));
    }
});


app.post('/order', async (req, res) => {

    try {

        // Validate the request
        await validator.order.postOne({ body: req.body });

        // Get Inventory of all products and details
        let inventory = (await requestPromise({
            uri: 'https://vrwiht4anb.execute-api.us-east-1.amazonaws.com/default/product',
            method: 'GET',
            json: true
        })).body;

        // Assign quantity and subtotal to order details
        let order_details = await Promise.map(req.body.items, item => {

            let details = _.find(inventory, { 'id': item.productId });
            Object.assign(details, { 'quantity': item.quantity, subtotal: (details.price * item.quantity) });
            return details;
        });
        // Caluculate Total Cost
        let total_cost = await Promise.map(order_details, order => { return order.subtotal })
        .reduce((total, order) => Number(total) + Number(order));

        let order = {
            id: uuid.v4(),
            customer_id: req.body.customerId,
            items: order_details,
            total: total_cost,
            deleted_at: null
        }

        await orders.insert(order);

        // Get order form DB to return in response
        let outOrder = orders.findOne({ 'id': order.id });

        console.log(util.inspect(outOrder, false, null));

        res.status(200).json({ 
            success : true, 
            data: outOrder
        });

    } catch (error) {
        console.log(error);
    }
});

app.put('/order/:id', async (req, res) => {

    try {
        let order = await orders.update(req.body.order);

        res.status(200).json({ 
            success : true, 
            data: order
        });

    } catch (error) {
        console.log(error);
    }
});


app.delete('/order/:id', async (req, res) => {

    try {
        let order = await orders.update({ 'id': req.params.id, 'deleted_at': true });

        res.status(200).json({ 
            success : true, 
            data: order
        });

    } catch (error) {
        console.log(error);
    }
});









module.exports.handler = serverless(app);