'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const app = express();
require('module-alias/register');

const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./swagger/config');

app.use(cors());

/*
 *출처: https://spiralmoon.tistory.com/entry/Nodejs-PayloadTooLargeError-request-entity-too-large [Spiral Moon's programming blog]
 */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const filelist = fs.readdirSync('./routes');
filelist.forEach(file => {
	if (file === "authDummy.js") return;
	var key = file.split('.')[0];
	app.use(`/${key}`, require(`./routes/${key}`));
})

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;