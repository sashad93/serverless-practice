# serverless-practice


This is a serverless lambda practice demo -- I havent had time to finish completely but this is what I've gotten so far after working for a couple hours. The project has basic BREAD/CRUD routes and handlers set up for orders. The request validation is in a separate file called utils that handles errors and validation.



## Installation

Clone the repo and checkout the master branch

```bash
npm install
```

After this step, use any MongoDB gui of your choice to create a local database called 
`
shopDB
`
and create a collection within that database called
`
orders
`

Make sure that your Mongo is configured to serve from the default uri:
```
mongodb://localhost:27017
```

## Usage


To start up API, simply run ```npm run dev```

The create order route is POST /order


