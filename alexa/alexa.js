module.exports = function(RED) {
    var bodyParser = require("body-parser");
    var multer = require("multer");
    var cookieParser = require("cookie-parser");
    var getBody = require('raw-body');
    var jsonParser = bodyParser.json();
    var urlencParser = bodyParser.urlencoded({extended:true});
    var typer = require('media-typer');
    var isUtf8 = require('is-utf8');
//    var verifier = require('alexa-verifier');

    
    var handleList = [];

    function createResponseWrapper(node,res) {
        var wrapper = {
            _res: res
        };
        var toWrap = [
            "append",
            "attachment",
            "cookie",
            "clearCookie",
            "download",
            "end",
            "format",
            "get",
            "json",
            "jsonp",
            "links",
            "location",
            "redirect",
            "render",
            "send",
            "sendfile",
            "sendFile",
            "sendStatus",
            "set",
            "status",
            "type",
            "vary"
        ];
        toWrap.forEach(function(f) {
            wrapper[f] = function() {
                node.warn(RED._("httpin.errors.deprecated-call",{method:"msg.res."+f}));
                var result = res[f].apply(res,arguments);
                if (result === res) {
                    return wrapper;
                } else {
                    return result;
                }
            }
        });
        return wrapper;
    }

// =============================================================
// =============================================================

    function AlexaLaunchReq(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);
        if (RED.settings.httpNodeRoot !== false && this.confSkill) {
            
            if (this.confSkill.url[0] !== '/') {
                this.confSkill.url = '/' + this.confSkill.url;
            }

        // ----------------------------------------------------

            var node    = this;
            setAlexaHandler(this.confSkill.url);

            handleList.push({
                "url":  this.confSkill.url,
                "type": "LaunchRequest",
                "node": node
            });

        // ----------------------------------------------------

            this.on("close",function() {
                var node = this;
                RED.httpNode._router.stack.forEach(function(route,i,routes) {
                    if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                        routes.splice(i,1);
                    }
                });
            });

        } else {
            this.warn(RED._("node-alexa.errors.not-created"));
        }
    }
    RED.nodes.registerType("Alexa LaunchRequest", AlexaLaunchReq);

// =============================================================
// =============================================================

    function AlexaIntentReq(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);
        if (RED.settings.httpNodeRoot !== false && this.confSkill) {
            
            if (this.confSkill.url[0] !== '/') {
                this.confSkill.url = '/' + this.confSkill.url;
            }

        // ----------------------------------------------------

            var node    = this;
            setAlexaHandler(this.confSkill.url);

            handleList.push({
                "url":  this.confSkill.url,
                "type": "IntentRequest",
                "node": node
            });

        // ----------------------------------------------------

            this.on("close",function() {
                var node = this;
                RED.httpNode._router.stack.forEach(function(route,i,routes) {
                    if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                        routes.splice(i,1);
                    }
                });
            });

        } else {
            this.warn(RED._("node-alexa.errors.not-created"));
        }
    }
    RED.nodes.registerType("Alexa IntentRequest", AlexaIntentReq);

// =============================================================
// =============================================================

    function AlexaCanFulfillIntentReq(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);
        if (RED.settings.httpNodeRoot !== false && this.confSkill) {
            
            if (this.confSkill.url[0] !== '/') {
                this.confSkill.url = '/' + this.confSkill.url;
            }

        // ----------------------------------------------------

            var node    = this;
            setAlexaHandler(this.confSkill.url);

            handleList.push({
                "url":  this.confSkill.url,
                "type": "CanFulfillIntentRequest",
                "node": node
            });

        // ----------------------------------------------------

            this.on("close",function() {
                var node = this;
                RED.httpNode._router.stack.forEach(function(route,i,routes) {
                    if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                        routes.splice(i,1);
                    }
                });
            });

        } else {
            this.warn(RED._("node-alexa.errors.not-created"));
        }
    }
    RED.nodes.registerType("Alexa CanFulfillIntentRequest", AlexaCanFulfillIntentReq);

// =============================================================
// =============================================================

    function SessionEndReq(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);
        if (RED.settings.httpNodeRoot !== false && this.confSkill) {
            
            if (this.confSkill.url[0] !== '/') {
                this.confSkill.url = '/' + this.confSkill.url;
            }

        // ----------------------------------------------------

            var node    = this;

            setAlexaHandler(this.confSkill.url);

            handleList.push({
                "url":  this.confSkill.url,
                "type": "SessionEndedRequest",
                "node": node
            });

        // ----------------------------------------------------

            this.on("close",function() {
                var node = this;
                RED.httpNode._router.stack.forEach(function(route,i,routes) {
                    if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                        routes.splice(i,1);
                    }
                });
            });

        } else {
            this.warn(RED._("node-alexa.errors.not-created"));
        }
    }
    RED.nodes.registerType("Alexa SessionEndRequest", SessionEndReq);

// =============================================================
// =============================================================

    function setAlexaHandler(url) { 
        
        this.errorHandler = function(err,req,res,next) {
            RED.log.error(err);
            res.sendStatus(500);
        };

        this.callback = function(req,res) {
            var type  = req.body.request.type
            var resp  = {};
            var user  = "";

            switch(type) {
                case "IntentRequest":
                case "CanFulfillIntentRequest":
                    if(req.body.request.intent.name == "AMAZON.StopIntent") {
                        type = "SessionEndedRequest";
                        user = req.body.session.sessionId;
                        break;
                    }
                    resp.intent = req.body.request.intent.name;
                    resp.slots  = req.body.request.intent.slots;

                case "LaunchRequest":
                case "SessionEndedRequest":
                    resp.type = type;
                    user      = req.body.session.sessionId;
            }

            //console.log("req.url="+req.url+"\n");
            var req_url=req.url;

            var idx = req_url.indexOf("/?");
            if (idx == -1)
            {   idx = req_url.indexOf("?");
	        }
            if (idx != -1)
            {   req_url = req_url.substring(0, idx);
            }
//console.log("req.url="+req_url+"\n");

            for (var i = 0, len = handleList.length; i < len; i++) {


//console.log("checking #"+i+"\n");
//console.log("    expected url="+handleList[i].url+"\n");
//                if(handleList[i].url == req.url && handleList[i].type == type) {
                if(handleList[i].url == req_url && handleList[i].type == type) {
//console.log("code was triggered\n");
                    var msg = { payload:resp, user:user, res:createResponseWrapper(handleList[i].node, res)}
//console.log("msg="+msg+"\n");
                    handleList[i].node.send(msg);
//console.log("message sent to node\n");
                }
            }
        };
 
        var httpMiddleware = function(req,res,next) { next(); }
        var corsHandler = function(req,res,next) { next(); }

        var multipartParser = function(req,res,next) { next(); }
        if (this.upload) {
            var mp = multer({ storage: multer.memoryStorage() }).any();
            multipartParser = function(req,res,next) {
                mp(req,res,function(err) {
                    req._body = true;
                    next(err);
                })
            };
        }

        if (RED.settings.httpNodeMiddleware) {
            if (typeof RED.settings.httpNodeMiddleware === "function") {
                httpMiddleware = RED.settings.httpNodeMiddleware;
            }
        }
/*
        var alexaVerifier = function(req, res, next) {
            if(!req.headers.signaturecertchainurl){
                    res.status(403).json({ status: 'failure', reason: er });
            }
            var er;
            // mark the request body as already having been parsed so it's ignored by 
            // other body parser middlewares 
            req._body = true;
            req.rawBody = '';
            req.on('data', function(data) {
                    return req.rawBody += data;
            });
            req.on('end', function() {
                    var cert_url, er, error, requestBody, signature;
                    try {
                            req.body = JSON.parse(req.rawBody);
                    } catch (error) {
                            er = error;
                            req.body = {};
                    }
                    cert_url = req.headers.signaturecertchainurl;
                    signature = req.headers.signature;
                    requestBody = req.rawBody;
                    verifier(cert_url, signature, requestBody, function(er) {
                            if (er) {
                                    RED.log.error('error validating the alexa cert:', er);
                                    res.status(401).json({ status: 'failure', reason: er });
                            } else {
                                    next();
                            }
                    });
            });
        }
*/        
	// verifier not working -- disabled
        RED.httpNode.post(url, cookieParser(), /*alexaVerifier,*/ httpMiddleware, corsHandler, urlencParser, multipartParser, this.callback, this.errorHandler);
    }

// =============================================================
// =============================================================

    function AlexaResponse(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);

        this.on("input",function(msg) {
            if (msg.res) {
                var statusCode = 200;
                var closing = true;

                if(typeof msg.closing !== 'undefined' && msg.closing !== null) 
                    closing = msg.closing;
    
                var json = {
                    "response": {
                        "shouldEndSession": closing,
                        "outputSpeech": {
                            "text": ""+msg.payload,
                            "type": "PlainText"
                        }
                    },
                    "version": "1.0"
                };
                msg.res._res.status(statusCode).send(json);

            } else {
                RED.log.warn(RED._("node-alexa.errors.no-response"));
            }
        });
    }
    RED.nodes.registerType("Alexa Response", AlexaResponse);

// =============================================================
// =============================================================

    function AlexaCanFulfillIntentResponse(config) {
        RED.nodes.createNode(this, config);
        this.confSkill = RED.nodes.getNode(config.skill);

        this.on("input",function(msg) {
            if (msg.res) {
                var statusCode = 200;
                var closing = true;

                if(typeof msg.closing !== 'undefined' && msg.closing !== null) 
                    closing = msg.closing;
    
                var json = {
                    "response": {
                        "canFulfillIntent": {
                            "canFulfill": ""+msg.payload
                        }
                    },
                    "version": "1.0"
                };
                msg.res._res.status(statusCode).send(json);

            } else {
                RED.log.warn(RED._("node-alexa.errors.no-response"));
            }
        });
    }
    RED.nodes.registerType("Alexa CanFulfillIntentResponse", AlexaCanFulfillIntentResponse);

// =============================================================
// =============================================================

    function ConfigAlexa(config) {
        RED.nodes.createNode(this, config);
        this.url = config.url;
    }
    RED.nodes.registerType("alexa-config", ConfigAlexa);
    
// =============================================================
// =============================================================

    function rawBodyParser(req, res, next) {
        if (req.skipRawBodyParser) { next(); } // don't parse this if told to skip
        if (req._body) { return next(); }
        req.body = "";
        req._body = true;

        var isText = true;
        var checkUTF = false;

        if (req.headers['content-type']) {
            var parsedType = typer.parse(req.headers['content-type'])
            if (parsedType.type === "text") {
                isText = true;
            } else if (parsedType.subtype === "xml" || parsedType.suffix === "xml") {
                isText = true;
            } else if (parsedType.type !== "application") {
                isText = false;
            } else if (parsedType.subtype !== "octet-stream") {
                checkUTF = true;
            } else {
                // applicatino/octet-stream
                isText = false;
            }
        }

        getBody(req, {
            length: req.headers['content-length'],
            encoding: isText ? "utf8" : null
        }, function (err, buf) {
            if (err) { return next(err); }
            if (!isText && checkUTF && isUtf8(buf)) {
                buf = buf.toString()
            }
            req.body = buf;
            next();
        });
    }
}
