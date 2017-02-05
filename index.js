const data = require('./config/default')
// console.log(data)

// Load the SDK and UUID
var AWS = require('aws-sdk')

// Create credentials
AWS.config.update({
    accessKeyId: "AKIAINLKNRAYC4TGXD2A",
    secretAccessKey: "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",
    "region": "eu-west-1"
})

var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'})

var lowerbound = data.lowerbound
var upperbound = data.upperbound
var order = data.order
var results = []


function getLowerBound(tableName) {

  	dynamodb.scan({
	    TableName : tableName,
	}, (err, data) => {
	    if (err) {
	        console.log('error','reading dynamodb failed: '+err)
	    }
	    lowerbound = lowerbound || data.Items[0].value.N
	    // console.log(lowerbound)
	})
}

function getUpperBound(tableName) {

  	dynamodb.scan({
	    TableName : tableName,
	}, (err, data) => {
	    if (err) {
	        console.log('error','reading dynamodb failed: '+err)
	    }
	    upperbound = upperbound || data.Items[0].value.N
	    // console.log(upperbound)
	})
}

function getOrder(tableName) {
	dynamodb.scan({
	    TableName : tableName
	}, (err, data) => {
	    if (err) {
	        console.log('error','reading dynamodb failed: '+err)
	    }
	    order = order || data.Items
	   	console.log(order)
	})	
}

function getSecret(tableName) {
	dynamodb.scan({
	    TableName : tableName
	}, (err, data) => {
	    if (err) {
	        console.log('error','reading dynamodb failed: '+err)
	    }
	    var secret = data.Items
	   	// console.log(secret)
	})	
}

function getFilteredCharacters(tableName) {
	dynamodb.scan({
	// Step 1: Retrieve all characters within lower and upper bounds
	    TableName : tableName
	}, (err, data) => {
	    if (err) {
	        console.log('error','reading dynamodb failed: '+err)
	    }
	   	data.Items.forEach( (item) => {
			if (item.number.N >= lowerbound && item.number.N <= upperbound) {
		    	results.push(item)
			}
		})

		// Step 2: Use the  from  and  to  mapping
		mapping(results, order)
	})	
}

/* Step 3: Use the from and to mapping in the application.order table to 
 * transform the results from the previous step into the right order.
 */
function mapping(results, order) {
	results.forEach( (result) => {
		order.forEach( (ord) => {
			if (result.id.S === ord.from.S) {
				result.number.N = ord.to.N
			}
		})
	})
	console.log(results)

	// test the output
	// if (results.id.S === 'e6ead05d-4906-4dd7-9ff9-a401783b4468') {
	// 	console.log(results.number.N)
	// }
}

getLowerBound("application.low")
getUpperBound("application.high")
getFilteredCharacters("application.characters")
getOrder("application.order")
getSecret("application.secret")
