'use strict';
if (process.env.LINE_CHANNEL_ACCESSTOKEN) {
	//	var channelSecret = process.env.LINE_CHANNEL_SECRET;
	// Load `*.js` under modules directory as properties
	//  i.e., `User.js` will become `exports['User']` or `exports.User`
	require('fs').readdirSync('./modules/').forEach(function (file) {
		if (file.match(/\.js$/) !== null && file !== 'index.js' && file.match(/^core-/) == null) {
			var name = file.replace('.js', '');
			exports[name] = require('../modules/' + file);
		}
	});
	var Linecountroll = 0;
	var Linecounttext = 0;
	const line = require('@line/bot-sdk');
	const express = require('express');
	function replymessage(message) {
		return {
			type: 'text',
			text: message
		}
	};
	//event.source.userId
	//event.source.groupId
	/*
	client.pushMessage('<to>', message)
		.then(() => {

		})
		.catch((err) => {
			// error handling
		});

	*/
	const BootTime = new Date(new Date().toLocaleString("en-US", {
		timeZone: "Asia/Shanghai"
	}));


	// create LINE SDK config from env variables
	const config = {
		channelAccessToken: process.env.LINE_CHANNEL_ACCESSTOKEN,
		channelSecret: process.env.LINE_CHANNEL_SECRET,
	};

	// create LINE SDK client
	const channelKeyword = process.env.DISCORD_CHANNEL_KEYWORD || "";
	const client = new line.Client(config);

	// create Express app
	// about Express itself: https://expressjs.com/
	const app = express();

	// register a webhook handler with middleware
	// about the middleware, please refer to doc
	app.post('/', line.middleware(config), (req, res) => {
		Promise
			.all(req.body.events.map(handleEvent))
			.then((result) => res.json(result))
			.catch((err) => {
				console.error(err);
				res.status(500).end();
			});
	});
	// event handler
	function handleEvent(event) {
		if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
			return console.log("Test hook recieved: " + JSON.stringify(event.message));
		}
		switch (event.type) {
			case 'message':
				const message = event.message;
				switch (message.type) {
					case 'text':
						return handleText(event);
					case 'image':
						return null;
					case 'video':
						return null;
					case 'audio':
						return null;
					case 'location':
						return null;
					case 'sticker':
						return null;
					default:
						throw new Error(`Unknown message: ${JSON.stringify(message)}`);
				}

			case 'follow':
				return null;

			case 'unfollow':
				return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

			case 'join':
				return null;

			case 'leave':
				return console.log(`Left: ${JSON.stringify(event)}`);

			case 'postback':
				return null

			case 'beacon':
				return null;

			default:
				throw new Error(`Unknown event: ${JSON.stringify(event)}`);
		}
	}
	// listen on port
	/*	const port = process.env.PORT || 5000;
		app.listen(port, () => {
			console.log(`Line BOT listening on ${port}`);
		});

		app.get('/', function (req, res) {
			//	res.send(parseInput(req.query.input));
			res.send('Hello');
		});

	*/
	app.on('UnhandledPromiseRejection', error => {
		// Will print "unhandledRejection err is not defined"
		console.log('UnhandledPromiseRejection: ', error.message);
	});
	app.on('unhandledRejection', error => {
		// Will print "unhandledRejection err is not defined"
		console.log('unhandledRejection: ', error.message);
	});
	function handleText(event) {
		if (event.message.type !== 'text') {
			// ignore non-text-message event
			return Promise.resolve(null);
		}
		let roomorgroupid, userid, displayname = ''
		let displaynamecheck = true;
		let userrole = 2;
		if (event.source.groupId) roomorgroupid = event.source.groupId
		if (event.source.roomId) roomorgroupid = event.source.roomId
		if (event.source.userId) userid = event.source.userId
		let displaynamecheck = true;
		//顯示使用者名字
		//Ub23daads22a2131312334645349a3 
		let rplyVal = {};
		let msgSplitor = (/\S+/ig)
		if (event.message.text)
			var mainMsg = event.message.text.match(msgSplitor); // 定義輸入字串
		if (mainMsg && mainMsg[0])
			var trigger = mainMsg[0].toString().toLowerCase(); // 指定啟動詞在第一個詞&把大階強制轉成細階

		// 訊息來到後, 會自動跳到analytics.js進行骰組分析
		// 如希望增加修改骰組,只要修改analytics.js的條件式 和ROLL內的骰組檔案即可,然後在HELP.JS 增加說明.
		if (trigger == ".me") {
			displaynamecheck = false
		}
		//顯示使用者名字

		let privatemsg = 0
		if (trigger.match(/^dr/i) && mainMsg && mainMsg[1]) {
			privatemsg = 1

			//mainMsg.shift()
			//trigger = mainMsg[0].toString().toLowerCase()
			event.message.text = event.message.text.replace(/^[d][r][ ]/i, '')
		}
		if (channelKeyword != '' && trigger == channelKeyword.toString().toLowerCase()) {
			//mainMsg.shift()
			rplyVal = exports.analytics.parseInput(event.message.text, roomorgroupid, userid, userrole)
		} else {
			if (channelKeyword == '') {
				rplyVal = exports.analytics.parseInput(event.message.text, roomorgroupid, userid, userrole)

			}

		}
		//可以多項回覆
		if (rplyVal && ((rplyVal[0] && rplyVal[0].text) || (rplyVal[1] && rplyVal[1].text))) {
			Linecountroll++;


			if (roomorgroupid && userid && displaynamecheck && rplyVal[0] && rplyVal[0].text)
				client.getProfile(userid).then(function (profile) {
					displayname = profile.displayName;
					rplyVal[0].text = "@" + displayname + "\n" + rplyVal[0].text
					//console.log(profile.displayName)
					//console.log(profile)
					//console.log('rplyVal.text:' + rplyVal.text)
					//console.log('Line Roll: ' + Linecountroll + ', Line Text: ' + Linecounttext, " content: ", event.message.text);
					sendmessage();
					//	在GP 而有加好友的話,顯示名字
				}, function () {
					sendmessage()
					//		如果對方沒加朋友,會出現 UnhandledPromiseRejectionWarning, 就跳到這裡
				})
			else {
				sendmessage()
				//	對方不在GP CHANNEL的話就跳到這裡
			}
			//console.log("LINE:" , event)
		} else {
			Linecounttext++;
			if (Linecounttext % 500 == 0)
				console.log('Line Roll: ' + Linecountroll + ', Line Text: ' + Linecounttext);
		}

		function sendmessage() {
			if (privatemsg == 1) {
				client.pushMessage(roomorgroupid, replymessage(displayname + ' 暗骰進行中'))
					.then(() => { })
					.catch((err) => {
						// error handling
					});
				//message.reply.text(message.from.first_name + ' 暗骰進行中')
				async function loada() {
					for (var a = 0; a < rplyVal.length; a++)
						if (rplyVal[a] && rplyVal[a.text]) //多項回覆
							for (var i = 0; i < rplyVal[a].text.toString().match(/[\s\S]{1,1900}/g).length; i++) {
								await client.pushMessage(userid, replymessage(rplyVal[a].text.toString().match(/[\s\S]{1,1900}/g)[i]))
									.then(() => { })
									.catch((err) => {
										// error handling
									});
							}
				}
				loada();
			} else {
				async function loadb() {
					for (var a = 0; a < rplyVal.length; a++) //多項回覆
						if (rplyVal[a] && rplyVal[a].text)
							for (var i = 0; i < rplyVal[a].text.toString().match(/[\s\S]{1,1900}/g).length; i++) {
								if (roomorgroupid)
									var replyTarget = roomorgroupid
								else replyTarget = userid
								await client.pushMessage(replyTarget, replymessage(rplyVal[a].text.toString().match(/[\s\S]{1,1900}/g)[i]))
									.then(() => { })
									.catch((err) => {
										// error handling
									});
							}
				}
				loadb();

			}
		}


		// create a echoing text message
		//exports.analytics.parseInput(event.message.text)

		// use reply API
		//Reply Max: 1900 characters
	}
	module.exports = {
		app,
		express
	}

}