/*
  https://github.com/chuank/node-red-contrib-socrata
*/

/*eslint no-console: ["error", { allow: ["log"] }] */

module.exports = function (RED) {
	"use strict";
	var req = require("request");
	var urllib = require("url");
	var querystring = require("querystring");

	// ******************************************
	// Configuration module - handles credentials
	// ******************************************
	function SocrataConfigNode(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name;
		this.url = n.url;

		if (this.credentials && this.credentials.hasOwnProperty("apptoken")) {
			this.apptoken = this.credentials.apptoken;
		}
	}
	// register the existence of the Socrata credentials configuration node
	RED.nodes.registerType("socrata-config", SocrataConfigNode, {
		credentials: {
			apptoken: { type: "password" }
		}
	});

	// ************
	// Socrata node
	// ************
	function Socrata(n) {
		// note: code in here runs whenever flow is re-deployed.
		// the node-RED 'n' object refers to a node's instance configuration and so is unique between Socrata nodes

		RED.nodes.createNode(this, n);

		var node = this;
		var opts;					// stores URL options that get passed to the Request handler

		// Get all properties from node instance settings
		// node.config = n;
		node.server = RED.nodes.getNode(n.server);
		node.name = n.name;
		node.dataid = n.dataid;
		node.soql = n.soql;

		// console.log("(Socrata Node) nodeUrl:", nodeUrl);

		node.on("input", function(msg) {
			node.status({ fill: "blue", shape: "dot", text: "requesting..." });

			// get latest
			node.server = RED.nodes.getNode(n.server);
			node.dataid = n.dataid;

			// grab url as specified in config node; noting possibility that
			// urls are likely to have a pathname specified
			opts = urllib.parse(node.server.url);		// build a URL object
			opts.method = "GET";
			// use httpRequestTimeout in settings.js if any; otherwise, set to 120 seconds
			if (RED.settings.httpRequestTimeout) {
				opts.timeout = parseInt(RED.settings.httpRequestTimeout) || 120000;
			} else {
				opts.timeout = 120000;
			}

			var path = opts.pathname.replace(/\/$/, "");
			var baseurl = opts.protocol + "//" + opts.host;
			var fullUrl = baseurl + path + "/" + node.dataid + ".json";
			opts = urllib.parse(fullUrl);

			if (!fullUrl) {
				node.error("undefined or invalid url");
				node.status({fill:"red",shape:"ring",text:"undefined or invalid url"});
				return;
			}

			// url must start http:// or https:// so assume http:// if not set
			if (fullUrl.indexOf("://") !== -1 && fullUrl.indexOf("http") !== 0) {
				node.warn("invalid HTTP/HTTPS transport");
				node.status({fill:"red",shape:"ring",text:"httpin.errors.invalid-transport"});
				return;
			}

			// set up the http request
			opts.headers = { "X-App-Token": node.server.apptoken };
			opts.uri = opts.href = fullUrl;
			opts.qs = JSON.parse(node.soql);

			// console.log("[Socrata] url object:", JSON.stringify(opts));

			// if there's an incoming message with a valid topic, process payload accordingly
			if (msg.topic === "dataid") {
				node.dataid = msg.payload;
			}
			if (msg.topic === "soql" ) {
				node.soql = msg.payload;
			}

			req(opts, function(err, response, body) {
				if(err) {
					console.log(err);
					node.error("Socrata API request error, check logs");
					node.status({fill:"red",shape:"ring",text:"request error"});
					return;
				}

				var reqOK = false;
				if(response) {
					switch(response.statusCode) {
					case 200:		// all good
						reqOK = true;
						// console.log("(Socrata) body: " + body);

						node.status({fill:"green",shape:"dot",text:response.statusCode + ": OK"});
						break;
					case 400:
						node.status({fill:"orange",shape:"ring",text:response.statusCode + ": Bad Request"});
						break;
					case 401:
						node.status({fill:"orange",shape:"ring",text:response.statusCode + ": Unauthorized"});
						break;
					case 403:
						node.status({fill:"orange",shape:"ring",text:response.statusCode + ": Forbidden"});
						break;
					case 404:
						node.status({fill:"orange",shape:"ring",text:response.statusCode + ": Not Found"});
						break;
					case 429:
						node.status({fill:"orange",shape:"ring",text:response.statusCode + ": Too Many Requests"});
						break;
					case 500:
						node.status({fill:"red",shape:"ring",text:response.statusCode + ": Server Error"});
						break;
					}
				}

				if(reqOK) {
					var msg = { "payload": JSON.parse(body) };
					node.send(msg);
				}

			});
		});
	}

	// register Socrata node
	RED.nodes.registerType("Socrata", Socrata, {});


	// ****************************
	// GC upon termination of nodes
	// ****************************
	Socrata.prototype.close = function() {
	};

	// *************************************************
	// Credentials management for the configuration node
	// *************************************************
	RED.httpAdmin.get("/socrata-config/:id", function(req, res) {
		var credentials = RED.nodes.getCredentials(req.params.id);
		if (credentials) {
			res.send(JSON.stringify({
				apptoken: credentials.apptoken
			}));
		} else {
			res.send(JSON.stringify({}));
		}
	});

	RED.httpAdmin.delete("/socrata-config/:id", function(req, res) {
		RED.nodes.deleteCredentials(req.params.id);
		res.send(200);
	});

	RED.httpAdmin.post("/socrata-config/:id", function(req, res) {
		var body = "";
		req.on("data", function(chunk) {
			body += chunk;
		});

		req.on("end", function() {
			var newCreds = querystring.parse(body);
			var credentials = RED.nodes.getCredentials(req.params.id) || {};

			// console.log("socrataconfig postCredentials:", credentials);

			if (newCreds.apptoken === "") {
				delete credentials.apptoken;
			} else {
				credentials.apptoken = newCreds.apptoken || credentials.apptoken;
			}
			RED.nodes.addCredentials(req.params.id, credentials);
			res.send(200);
		});
	});
};
