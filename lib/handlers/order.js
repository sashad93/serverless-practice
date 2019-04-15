'use strict';
const Promise = require('bluebird');
global.Promise = Promise;
const serverless = require('serverless-http');
const requestPromise = require('request-promise');
const MongoClient = require('mongodb').MongoClient;
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

var db = new loki('orders.json');
var orders = db.addCollection('orders');

var mongo_url = 'mongodb://localhost:27017';


app.get('/order/:id', async (req, res) => {

    try {
    	 // Connect to Mongo
        const mongoConnection = await MongoClient.connect( mongo_url, { useNewUrlParser: true } );
        const db = mongoConnection.db('shopDB');
        let orders = db.collection('orders');

        let order = await orders.findOne({ 'id': req.params.id , 'deleted_at': null });

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
         // Connect to Mongo
        const mongoConnection = await MongoClient.connect( mongo_url, { useNewUrlParser: true } );
        const db = mongoConnection.db('shopDB');
        let orders = db.collection('orders');

        let order = await orders.find({ 'deleted_at': null }).toArray();

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
        // Connect to Mongo
        const mongoConnection = await MongoClient.connect( mongo_url, { useNewUrlParser: true } );
        const db = mongoConnection.db('shopDB');
        let orders = db.collection('orders');

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
            customerId: req.body.customerId,
            items: order_details,
            total: total_cost,
            deleted_at: null
        }

        await orders.insertOne(order);

        // Get order form DB to return in response
        let outOrder = await orders.findOne({ id: order.id });

        res.status(200).json({ 
            success : true, 
            data: outOrder
        });

    } catch (error) {
        const err = await handleError(error);
        res.status(err.statusCode).json(JSON.parse(err.body));
    }
});

app.put('/order/:id', async (req, res) => {

    try {
        // Connect to Mongo
        const mongoConnection = await MongoClient.connect( mongo_url, { useNewUrlParser: true } );
        const db = mongoConnection.db('shopDB');
        let orders = db.collection('orders');

        let order = await orders.findOne({ id: req.params.id });

        order = await orders.update({ id: req.params.id }, Object.assign(order, req.body));
        order = await orders.findOne({ id: req.params.id });

        res.status(200).json({ 
            success : true, 
            data: order
        });

    } catch (error) {
        const err = await handleError(error);
        res.status(err.statusCode).json(JSON.parse(err.body));
    }
});


app.delete('/order/:id', async (req, res) => {

    try {
        // Connect to Mongo
        const mongoConnection = await MongoClient.connect( mongo_url, { useNewUrlParser: true } );
        const db = mongoConnection.db('shopDB');
        let orders = db.collection('orders');

        let order = await orders.findOne({ id: req.params.id });
        order = await orders.update({ id: req.params.id }, Object.assign(order, { 'deleted_at': true }));
        order = await orders.findOne({ id: req.params.id });

        res.status(200).json({ 
            success : true, 
            data: order
        });

    } catch (error) {
        const err = await handleError(error);
        res.status(err.statusCode).json(JSON.parse(err.body));
    }
});









module.exports.handler = serverless(app);