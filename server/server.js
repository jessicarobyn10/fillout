const express = require('express');
const path = require('path')
const app = express();
const PORT = 3000;
require('dotenv').config();

app.use(express.json());

const filterController = require('./middleware/filter');

// HTTP get request for fetching form responses
app.get('/:formId/filteredResponses', filterController.filterResponse, (req, res) => {
  return res.status(200).json(res.locals.data);
});


// 404 handler for unknown routes
app.use('*', (req, res) => {
  return res.status(404).send('Page not found')
})

// global error handler
app.use((err, req, res, next) => {
  const DefaultErr = {
    log: 'Express server caught unknown middleware error', 
    status: 500,
    message: { err: 'Server error' }
  }
  const ErrorObj = Object.assign(DefaultErr, err);
  console.log(ErrorObj.log);
  return res.status(ErrorObj.status).json(ErrorObj.message);
})

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
});

module.exports = app;