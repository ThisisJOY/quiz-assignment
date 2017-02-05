const data = require('./config/default')
// console.log(data)

// Load the SDK and UUID
var AWS = require('aws-sdk')

// Create credentials
AWS.config.update({
    accessKeyId: "AKIAINLKNRAYC4TGXD2A",
    secretAccessKey: "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",
    "region": "eu-west-1",
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

/* Step 1: 
 * Retrieve all characters within lower and upper bounds.
 */
function getFilteredCharacters(tableName) {
	dynamodb.scan({

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

	   	// console.log(results)
		console.log(results.length)		// 793

		mapping(results, order)
	})	
}

/* Step 2: 
 * Use the from and to mapping in the application.order table to 
 * transform the results from the previous step into the right order.
 */

//     KeySchema: [       
//         { AttributeName: "id", KeyType: "HASH"},  //Partition key
//         { AttributeName: "number", KeyType: "RANGE" }  //Sort key
//     ],

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

/* Step 3: 
 * Get the secret number by using the constructed key from step 2 on application.secret
 */

/* Step 4:
 * Divide the retrieved secret number by the amount of objects retrieved in question 1
 * multiplied by the consumed read capacity for that search operation.
 */

//     ProvisionedThroughput: {       
//         ReadCapacityUnits: 10, 
//         WriteCapacityUnits: 10
//     }


/* Step 5: Write your result to the application.results table. Use your own name as key and
 * submit as attribute to the answer field.
 */

function writeToTable() {
	var docClient = new AWS.DynamoDB.DocumentClient();

	var table = "application.results";

	var name = 'qiaoqiao';
	var answer = results;

	var params = {
	    TableName:table,
	    Item:{
	        "name": name,
	        "answer": answer
	    }
	};

	console.log("Adding a new item...");
	docClient.put(params, function(err, data) {
	    if (err) {
	        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("Added item:", JSON.stringify(data, null, 2));
	    }
	})
}

getLowerBound("application.low")
getUpperBound("application.high")
getFilteredCharacters("application.characters")
getOrder("application.order")
getSecret("application.secret")
// writeToTable()