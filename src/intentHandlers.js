/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var textHelper = require('./textHelper'),
    storage = require('./storage');

var registerIntentHandlers = function (intentHandlers, skillContext) {

	intentHandlers.AddIngredient = function (intent, session, response) {
		//load the customer's bar ingredients
		var newIngredient = intent.slots.Ingredient.value;
		if (!newIngredient) {
            response.ask('OK. What do you want to add?', 'What do you want to add to your bar?');
            return;
        }
        var currentBar = storage.newBar(session);
        storage.loadBar(session, function(currentBar) {
        	var speechOutput;
        	if (currentBar.addIngredient(newIngredient)) {
				currentBar.save(function() {
					speechOutput = 'I added ' + newIngredient + ' to your bar.';
					response.tell(speechOutput);
				});
			} else {
				speechOutput = 'You already have ' + newIngredient + ' in your bar.';
				response.tell(speechOutput);
			}
		});
	};
	
	intentHandlers.RemoveIngredient = function (intent, session, response) {
		//load the customer's bar ingredients
		var newIngredient = intent.slots.Ingredient.value;
		if (!newIngredient) {
            response.ask('OK. What do you want to remove?', 'What do you want to remove from your bar?');
            return;
        }
        var currentBar = storage.newBar(session);
        storage.loadBar(session, function(currentBar) {
        	var speechOutput;
        	if (currentBar.removeIngredient(newIngredient)) {
				currentBar.save(function() {
					speechOutput = 'I removed ' + newIngredient + ' from your bar.';
					response.tell(speechOutput);
				});
			} else {
				speechOutput = 'You don\'t have ' + newIngredient + ' in your bar.';
				response.tell(speechOutput);
			}
        }); 
	};
	
	intentHandlers.AskIngredients = function (intent, session, response) {
		var currentBar = storage.newBar(session);
		storage.loadBar(session, function(currentBar) {
			var speechOutput = 'You have ' + currentBar.numIngredients() + ' ingredients in your bar.';
			response.tell(speechOutput);
		});
	};
	
	intentHandlers.AskIngredient = function (intent, session, response) {
		var slotIngredient = intent.slots.Ingredient.value;
		if (!slotIngredient) {
			response.ask('OK. What ingredient can I check on for you?', 'What ingredient can I check on for you?');
			return;
		}
		var currentBar = storage.newBar(session);
		storage.loadBar(session, function(currentBar) {
			var speechOutput;
			if(currentBar.hasIngredient(slotIngredient)) {
				speechOutput = 'Yes, you have ' + slotIngredient + ' in your bar.';
			} else {
				speechOutput = 'No, you don\'t have ' + slotIngredient + ' in your bar.';
			}
			response.tell(speechOutput);
		});
	};
	
	intentHandlers.GetRecipe = function (intent, session, response) {
		//ask if we have enough for a drink
		var drinkName = intent.slots.Drink.value;
		if (!drinkName) {
			response.ask('Ok. What drink are you trying to make?', 'What drink are you trying to make?');
			return;
		}
		storage.getDrinkByName(session, drinkName, function(returnedDrink) {
			var speechOutput = 'To make ' + drinkName + returnedDrink.Directions;
			response.tell(speechOutput);
		});
	};
	
	intentHandlers.AskRecipe = function (intent, session, response) {
		//ask if we have enough for a drink
		var drinkName = intent.slots.Drink.value;
		if (!drinkName) {
			response.ask('Ok. What drink are you trying to make?', 'What drink are you trying to make?');
			return;
		}
		var currentBar = storage.newBar(session);
		storage.loadBar(session, function(currentBar) {
			console.log('Bar= ' + currentBar.hasIngredient('whiskey'));
			storage.getDrinkByName(session, drinkName, function(returnedDrink) {
				if(returnedDrink) {
					var ingredientsList = returnedDrink.IngredientsList;
					var hasAllIngredients = true;
					var speechOutput = '';
					var needIngredients = new Array();
					console.log('IngredientsList= ' + ingredientsList);
					ingredientsList.forEach(function(ingredient) {
						if (currentBar.hasIngredient(ingredient)) {
							console.log('You have ' + ingredient);
						} else {
							needIngredients.push(ingredient);
							console.log('You need ' + ingredient);
							hasAllIngredients = false;
						}
					});
					if (hasAllIngredients) {
						speechOutput = 'You have all you need to make ' + returnedDrink.ResponseName;
					} else {
						speechOutput = 'You still need ';
						for(var i = 0; i < needIngredients.length; i++) {
							if(i < (needIngredients.length - 1)) {
								speechOutput += needIngredients[i] + ', ';
							} else {
								speechOutput += 'and ' + needIngredients[i];
							}
						}
						speechOutput += ' to make ' + returnedDrink.ResponseName;
					}
					response.tell(speechOutput);
				} else {
					response.ask('What drink are you trying to make?', 'What drink are you trying to make?');
				}
			});
		});
	};

    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        var speechOutput = textHelper.completeHelp;
        if (skillContext.needMoreHelp) {
            response.ask(textHelper.completeHelp + ' So, how can I help?', 'How can I help?');
        } else {
            response.tell(textHelper.completeHelp);
        }
    };

    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can ask me more about your bar.');
        } else {
            response.tell('');
        }
    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can ask me more about your bar.');
        } else {
            response.tell('');
        }
    };
};
exports.register = registerIntentHandlers;
