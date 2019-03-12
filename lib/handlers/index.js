'use strict';
const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Add JSON body and URL encoder middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
	res.status(200).json({ success : true, msg: 'Hello World! This is a practice serverless express api' });
})

module.exports.handler = serverless(app);