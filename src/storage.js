/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var AWS = require("aws-sdk");

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
	var docClient = new AWS.DynamoDB.DocumentClient();

	function Drink(session, data) {
		if (data) {
			this.data = data;
		} else {
			this.data = {
				directions: "",
				glass: "",
				isShaken: false,
				tools: "",
				ingredients: ""
			}
		}
		this._session = session;
	}
	
	function Bar(session, data) {
		if (data) {
			this.data = data;
		} else {
			this.data = {
				ingredients: []
			}
		}
		this._session = session;
	}
	
	Bar.prototype = {
		numIngredients: function() {
			return (this.data.ingredients.length);
		},
		isEmpty: function () {
			//check if the bar is empty of ingredients
			return (this.data.ingredients.length === 0);
		},
		hasIngredient: function (ingredient) {
			var present = false;
			var pos = this.data.ingredients.indexOf(ingredient);
			if (pos > -1) {
				present = true;
			}
			return present;
		},
		addIngredient: function (ingredient) {
			//add an ingredient to the bar
			var added = true;
			if (this.hasIngredient(ingredient)) {
				added = false;
			} else {
				this.data.ingredients.push(ingredient);
			}
			return added;
		},
		removeIngredient: function(ingredient) {
			//remove an ingredient from the bar
			var removed = true;
			console.log('ingredients ' + this.data.ingredients);
			var pos = this.data.ingredients.indexOf(ingredient);
			console.log('position ' + pos);
			if (pos > -1) {
				this.data.ingredients.splice(pos, 1);
			} else {
				removed = false;
			}
			return removed;
		},
		save: function (callback) {
			//save the bar with the new item in our db
			this._session.attributes.currentBar = this.data;
			dynamodb.putItem({
				TableName: 'UserBarIngredients',
				Item: {
					CustomerId: {
						S: this._session.user.userId
					},
					Data: {
						S: JSON.stringify(this.data)
					}
				}
			}, function (err, data) {
                	if (err) {
                    	console.log(err, err.stack);
                	}
                	if (callback) {
                    	callback();
                	}
            });
		}
	}

    return {
        loadBar: function (session, callback) {
        	console.log('loading bar ' + session.attributes.currentBar);
            if (session.attributes.currentBar) {
                console.log('get bar from session=' + session.attributes.currentBar);
                callback(new Bar(session, session.attributes.currentBar));
                return;
            }
            dynamodb.getItem({
                TableName: 'UserBarIngredients',
                Key: {
                    CustomerId: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var currentBar;
                console.log('loading bar returned');
                if (err) {
                	console.log('error loading bar');
                    console.log(err, err.stack);
                    currentBar = new Bar(session);
                    session.attributes.currentBar = currentBar.data;
                    callback(currentBar);
                } else if (data.Item === undefined) {
                	console.log('item undefined');
                    currentBar = new Bar(session);
                    session.attributes.currentBar = currentBar.data;
                    callback(currentBar);
                } else {
                    console.log('get bar from dynamodb=' + data.Item.Data.S);
                    currentBar = new Bar(session, JSON.parse(data.Item.Data.S));
                    session.attributes.currentBar = currentBar.data;
                    callback(currentBar);
                }
            });
        },
		newBar: function (session) {
			console.log('creating new bar');
            return new Bar(session);
        },
        getDrinkByName: function (session, drinkName, callback) {
			var params = {
    			TableName: "Drinks",
    			FilterExpression: "contains (#name, :drinkName)",
    			ExpressionAttributeNames: {
       				"#name": "OtherNames",
    			},
    			ExpressionAttributeValues: {
         			":drinkName": drinkName
    			}
			};
			console.log('getDrinkByName: ' + drinkName);
			docClient.scan(params, function(err, data) {
				if (err) {
        			console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    			} else {
        			console.log("Query succeeded.");
        			data.Items.forEach(function(item) {
            			console.log(" -", item.Name + ": " + item.IsShaken);
            		});
            		callback(data.Items[0]);
            	}
			});
        },
        getDrinksByIngredient: function (session, ingredient, callback) {
        }
    };
})();
module.exports = storage;
