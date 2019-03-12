'use strict';
const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const { Validator } = require('jsonschema');
const uuid = require('uuid');
const moment = require('moment');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));































module.exports.handler = serverless(app);