// SkillCode generated code.
// Paste this into an AWS Lambda function based on the Fact blueprint.

const invocationName = "what i like";
const skillName = 'What I Like';
const apiKey = 'API key here';

const possibleInputs = [
		'The Incredibles',
		'Pulp Fiction',
		'Black Panther',
		'Game of Thrones',
		'Breaking Bad',
		'Stranger Things',
		'Daniel Tiger',
		'Annedroids',
		'U2',
		'Dave Matthews',
		'Merle Haggard',
		'Jack Johnson',
		'Homeland',
		'Moana',
		'Chance the Rapper',
		'Gone with the Wind',
		'Titanic',
		'Jurassic Park',
		'Shrek',
		'Finding Nemo',
		'Avatar',
		'Beauty and the Beast'
];

const languageStrings = {
	'en': {
		'translation': {
			'WELCOME1' : 'Welcome to ' + invocationName + '! You can say things such as, I like The Incredibles, or you can say, recommend something like Game of Thrones. Now, let\'s get started.',
			'HELP'    : 'You can tell me movies, books, tv shows and bands that you like. Just say something such as, I like Breaking Bad. You can also say help or stop. ',
			'STOP'    : 'Goodbye!'
		}
	}
};
const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

const Alexa = require("alexa-sdk");
const https = require("https");

exports.handler = function(event, context, callback) {
	let alexa = Alexa.handler(event, context);
	alexa.appId = APP_ID; //

	alexa.resources = languageStrings;
	// alexa.dynamoDBTableName = "myTable"; // persistent session attributes
	alexa.registerHandlers(handlers);
	alexa.execute();
}

const handlers = {
	'AMAZON.CancelIntent': function () {

		let say = this.t('STOP');
		this.response
			.speak(say);

		this.emit(':responseReady');
	},
	'AMAZON.HelpIntent': function () {

		let say = this.t('HELP');
		this.response
			.speak(say)
			.listen('try again, ' + say)
			.cardRenderer('What I Like Help', this.t('HELP')); // , welcomeCardImg

		this.emit(':responseReady');
	},
	'AMAZON.StopIntent': function () {

		let say = this.t('STOP');
		this.response
			.speak(say);

		this.emit(':responseReady');
	},

	'AMAZON.YesIntent': function() {
		console.log('said yes');
		this.emitWithState('NextRecommendationIntent');
	},

	'AMAZON.NoIntent': function() {
		let say = 'OK, goodbye.';
		this.response
			.speak(say);

		this.emit(':responseReady');
	},


	'NextRecommendationIntent': function() {
		let recommendations = this.attributes.recommendations;
		let recommendation = recommendations[0];
		recommendations.shift();

		let introPhrases = [
			'OK, another option. I think you will ',
			'Sure, here\'s another based on ' + this.attributes.input + '. You might ',
			'OK, since you like ' + this.attributes.input + ', you may ',
			'Sure, based on ' + this.attributes.input + ', I think you may ',
			'Another one. You may ',
			'Sure thing. You might ',
		];

		let likeWords = [
			'like',
			'enjoy',
			'want to try',
			'be interested in'
		];

		let endPhrases = [
				'I have ' + recommendations.length + ' more recommendations. Want another?',
				'Want another one?',
				'Want another recommendation?',
				'Do you want another one?',
				'I have more where that came from. Ready?',
				'I have more ideas. Want to keep going?',
				'Want to keep going?',
				'I have ' + recommendations.length + ' more. Should I keep going?'
		];


		let endPhrase = endPhrases[Math.floor(Math.random() * endPhrases.length)];
		let emit = 'askWithCard';
		if ( recommendations.length === 1 ) {
			endPhrase = 'You made it this far, impressive! I have just one more idea. Want to hear it?';
			emit = 'tellWithCard';
		}
		if ( !recommendations.length ) {
			endPhrase = 'That\'s all I have. Thanks for using the What I Like skill!';
			emit = 'tellWithCard';
		}
		console.log(JSON.stringify(recommendation));
		let recommendationType = recommendation.Type;
		let phrase = 'the ' + recommendationType + ', ';
		if (recommendationType === 'music') {
			phrase = 'music by';
		}
		let introPhrase = introPhrases[Math.floor(Math.random() * introPhrases.length)];
		let likeWord = likeWords[Math.floor(Math.random() * likeWords.length)];
		let speechOutput = introPhrase + likeWord + ' ' + phrase + ' ' + recommendation.Name + '. ' + endPhrase;
		console.log("Speech output: ", speechOutput);
		this.attributes.lastSpeech = speechOutput;
		this.attributes.recommendations = recommendations;

		let repromptSpeech = speechOutput;
		let cardTitle = skillName;
		let cardContent = speechOutput;

		this.emit(':' + emit, speechOutput, repromptSpeech, cardTitle, cardContent);
		// this.emit(':ask', speechOutput );

	},

	'AMAZON.RepeatIntent': function () {
    this.response.speak(this.attributes.lastSpeech);
    this.emit(':responseReady');
  },

	'RecommendationIntent': function () {
		console.log(this.event.request.intent);
		console.log("current request in RecommendationIntent: " + JSON.stringify(this.event.request));

		// delegate to Alexa to collect all the required slots
		let filledSlots = delegateSlotCollection.call(this);

		if (!filledSlots) {
			return;
		}

		console.log("filled slots: " + JSON.stringify(filledSlots));
		// at this point, we know that all required slots are filled.
		let slotValues = getSlotValues(filledSlots);
		let query = slotValues.typeInput.resolved;
		// let type = slotValues.media.resolved;

		console.log(JSON.stringify(slotValues));

		// let type_param = '';
		// if (type) {
		// 	type_param = '&type=' + type;
		// }

		// this.response.speak(query);

		let limit = '10';
		let url = 'https://tastedive.com/api/similar?q=' + query + '&limit=' + limit + '&k=' + apiKey;

		const self = this;

		https.get(url, res => {
			res.setEncoding("utf8");
			let body = "";
			res.on("data", data => {
				body += data;
			});
			res.on("end", () => {
				body = JSON.parse(body);
				if (body.error) {
					self.response.speak('There was an error getting your recommendation. Please try again soon.');
					self.emit(':responseReady');
				}
				else {

					let recommendations = body.Similar.Results;
					console.log('recommendations.length', recommendations.length);
					self.attributes.newRecommendation = 'false';

					if ( !recommendations.length ) {
						self.attributes.newRecommendation = 'true';
						self.emit(':tell', 'Sorry, I could not find anything for that. Please try again soon.');
						self.emit(':responseReady');
					}
					else {
						console.log(JSON.stringify(recommendations));

						// get a random recommendation from the results
						// let recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];

						let recommendation = recommendations[0];
						recommendations.shift();
						let endPhrase = 'I have more recommendations. Want one?';
						let emit = 'askWithCard';
						if ( !recommendations.length ) {
							endPhrase = 'That\'s all I have. Thanks for using the What I Like skill!';
							// emit = 'tell';
							emit = 'tellWithCard';
						}
						console.log(JSON.stringify(recommendation));
						let recommendationType = recommendation.Type;
						let phrase = 'the ' + recommendationType + ', ';
						if (recommendationType === 'music') {
							phrase = 'music by';
						}
						let speechOutput = 'You want a recommendation based on ' +
							slotValues.typeInput.resolved + '. ' +
							'I think you would like ' + phrase + ' ' + recommendation.Name +
							'. ' + endPhrase;
						console.log("Speech output: ", speechOutput);
						self.attributes.lastSpeech = 'I think you would like ' + phrase + ' ' + recommendation.Name +
						'. I have ' + recommendations.length + ' more recommendations. Want another?';
						self.attributes.recommendations = recommendations;
						self.attributes.input = slotValues.typeInput.resolved;

						let repromptSpeech = speechOutput;
						let cardTitle = skillName;
						let cardContent = speechOutput;

						self.emit(':' + emit, speechOutput, repromptSpeech, cardTitle, cardContent);

						// self.emit(':' + emit, speechOutput);
						// self.response.speak(speechOutput);
						// self.emit(':responseReady');

					}
				}

			});
		});


	},
	'LaunchRequest': function () {
		let index1 = Math.floor(Math.random() * possibleInputs.length);
		let possibleInput1 = possibleInputs[index1];
		let remove = possibleInputs.indexOf(index1);

		if (remove > -1) {
		  possibleInputs.splice(remove, 1);
		}

		let index2 = Math.floor(Math.random() * possibleInputs.length);
		let possibleInput2 = possibleInputs[index2];

		let say = 'Welcome to ' + invocationName + '! You can say things such as, I like ' + possibleInput1 + ', or you can say, recommend something like ' + possibleInput2 + '. Now, let\'s get started.';
		this.response
			.speak(say)
			.listen('let\'s try again, ' + say);

		this.emit(':responseReady');
	},
	'Unhandled': function () {
		let say = 'I did not quite understand what you wanted. Do you want to try something else? You can also say, help.';
		this.response
			.speak(say)
			.listen(say);
	}};
//  ------ Helper Functions -----------------------------------------------

function randomPhrase(myArray) {
	return(myArray[Math.floor(Math.random() * myArray.length)]);
}

// returns slot resolved to an expected value if possible
function resolveCanonical(slot){
	try {
		var canonical = slot.resolutions.resolutionsPerAuthority[0].values[0].value.name;
	} catch(err){
		console.log(err.message);
		var canonical = slot.value;
	};
	return canonical;
};

// used to emit :delegate to elicit or confirm Intent Slots
function delegateSlotCollection(){
	console.log("current dialogState: " + this.event.request.dialogState);
	if (this.event.request.dialogState === "STARTED") {
		var updatedIntent = this.event.request.intent;
		console.log(updatedIntent);

		this.emit(":delegate");

	} else if (this.event.request.dialogState !== "COMPLETED") {

		this.emit(":delegate");

	} else {
		console.log("returning: "+ JSON.stringify(this.event.request.intent));

		return this.event.request.intent;
	}
}

const REQUIRED_SLOTS = [
	"inputType"
];

/* API */
// TODO: Currently unused, need to refactor to use this instead from necessary intents
function getRecommendation(q, type, callback) {
	let url = 'https://tastedive.com/api/similar?q=' + q + '&type=' + type + '&k=' + apiKey;
	https.get(url, res => {
		res.setEncoding("utf8");
		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", () => {
			body = JSON.parse(body);
			let recommendations = body.Similar.Results;
			callback( body );
		});
	});
}


// ***********************************
// ** Helper functions from
// ** These should not need to be edited
// ** www.github.com/alexa/alexa-cookbook
// ***********************************


// ***********************************
// ** Dialog Management
// ***********************************

function getSlotValues (filledSlots) {
	//given event.request.intent.slots, a slots values object so you have
	//what synonym the person said - .synonym
	//what that resolved to - .resolved
	//and if it's a word that is in your slot values - .isValidated
	let slotValues = {};

	console.log('The filled slots: ' + JSON.stringify(filledSlots));
	Object.keys(filledSlots).forEach(function(item) {
		//console.log("item in filledSlots: "+JSON.stringify(filledSlots[item]));
		var name = filledSlots[item].name;
		//console.log("name: "+name);
		if(filledSlots[item]&&
			filledSlots[item].resolutions &&
			filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
			filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
			filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code ) {

			switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
				case "ER_SUCCESS_MATCH":
					slotValues[name] = {
						"synonym": filledSlots[item].value,
						"resolved": filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
						"isValidated": true
					};
					break;
				case "ER_SUCCESS_NO_MATCH":
					slotValues[name] = {
						"synonym": filledSlots[item].value,
						"resolved": filledSlots[item].value,
						"isValidated":false
					};
					break;
			}
		} else {
			slotValues[name] = {
				"synonym": filledSlots[item].value,
				"resolved": filledSlots[item].value,
				"isValidated": false
			};
		}
	},this);
	console.log("slot values: "+JSON.stringify(slotValues));
	return slotValues;
}
// This function delegates multi-turn dialogs to Alexa.
// For more information about dialog directives see the link below.
// https://developer.amazon.com/docs/custom-skills/dialog-interface-reference.html
function delegateSlotCollection() {
	console.log("in delegateSlotCollection");
	console.log("current dialogState: " + this.event.request.dialogState);

	if (this.event.request.dialogState === "STARTED") {
		console.log("in STARTED");
		console.log(JSON.stringify(this.event));
		var updatedIntent=this.event.request.intent;
		// optionally pre-fill slots: update the intent object with slot values
		// for which you have defaults, then return Dialog.Delegate with this
		// updated intent in the updatedIntent property

		disambiguateSlot.call(this);
		console.log("disambiguated: " + JSON.stringify(this.event));
		this.emit(":delegate", updatedIntent);
	} else if (this.event.request.dialogState !== "COMPLETED") {
		console.log("in not completed");
		//console.log(JSON.stringify(this.event));
			disambiguateSlot.call(this);
			this.emit(":delegate", updatedIntent);
	} else {
		console.log("in completed");
		//console.log("returning: "+ JSON.stringify(this.event.request.intent));
		// Dialog is now complete and all required slots should be filled,
		// so call your normal intent handler.
		return this.event.request.intent.slots;
	}
	return null;
}
// If the user said a synonym that maps to more than one value, we need to ask
// the user for clarification. Disambiguate slot will loop through all slots and
// elicit confirmation for the first slot it sees that resolves to more than
// one value.
function disambiguateSlot() {
	let currentIntent = this.event.request.intent;
	console.log('in disambiguate, currentIntent: ', currentIntent);

	Object.keys(this.event.request.intent.slots).forEach(function(slotName) {
		let currentSlot = this.event.request.intent.slots[slotName];
		let slotValue = slotHasValue(this.event.request, currentSlot.name);
		if (currentSlot.confirmationStatus !== 'CONFIRMED' &&
			currentSlot.resolutions &&
			currentSlot.resolutions.resolutionsPerAuthority[0]) {

			if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_MATCH') {
				// if there's more than one value that means we have a synonym that
				// mapped to more than one value. So we need to ask the user for
				// clarification. For example if the user said "mini dog", and
				// "mini" is a synonym for both "small" and "tiny" then ask "Did you
				// want a small or tiny dog?" to get the user to tell you
				// specifically what type mini dog (small mini or tiny mini).
				if ( currentSlot.resolutions.resolutionsPerAuthority[0].values.length > 1) {
					let prompt = 'Which would you like';
					let size = currentSlot.resolutions.resolutionsPerAuthority[0].values.length;
					currentSlot.resolutions.resolutionsPerAuthority[0].values.forEach(function(element, index, arr) {
						prompt += ` ${(index == size -1) ? ' or' : ' '} ${element.value.name}`;
					});

					prompt += '?';
					let reprompt = prompt;
					// In this case we need to disambiguate the value that they
					// provided to us because it resolved to more than one thing so
					// we build up our prompts and then emit elicitSlot.
					this.emit(':elicitSlot', currentSlot.name, prompt, reprompt);
				}
			} else if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {
				// Here is where you'll want to add instrumentation to your code
				// so you can capture synonyms that you haven't defined.
				console.log("NO MATCH FOR: ", currentSlot.name, " value: ", currentSlot.value);

				if (REQUIRED_SLOTS.indexOf(currentSlot.name) > -1) {
					let prompt = "What " + currentSlot.name + " are you looking for";
					this.emit(':elicitSlot', currentSlot.name, prompt, prompt);
				}
			}
		}
	}, this);
}

// Given the request an slot name, slotHasValue returns the slot value if one
// was given for `slotName`. Otherwise returns false.
function slotHasValue(request, slotName) {

	let slot = request.intent.slots[slotName];

	//uncomment if you want to see the request
	//console.log("request = "+JSON.stringify(request));
	let slotValue;

	//if we have a slot, get the text and store it into speechOutput
	if (slot && slot.value) {
		//we have a value in the slot
		slotValue = slot.value.toLowerCase();
		return slotValue;
	} else {
		//we didn't get a value in the slot.
		return false;
	}
}
