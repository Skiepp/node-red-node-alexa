# node-red-node-alexa

Thisis a simple library to easily integrate with Alexa.


## (I) Configuration Node
This set of nodes requires only an URL to be configured.
Just use the "new alexa-config" option and choose an URL.

ex: /alexa


## (II) First configuration
1) Access the Amazon Developer page.
2) Create a new skill using the Skill Kit.
3) Create the model of your interest.
4) In the endpoint section, just insert:
###### \<Node-RED endpoit\>/\<url-configured in configuration node\>
ex: https://myNodeRed/alexa

Note:
* SSL is required and the node-red server must accept requests on port 443.
* TLS 1.3 is currently required by Amazon for HTTPS


## (III) Nodes:

### Alexa Launch
Called when a LaunchRequest intent is received.
###### payload.type -\> LaunchRequest

### Alexa Intent
Called when an IntentRequest intent is received.
###### payload.type -\> IntentRequest
###### payload.intent -\> [...]
###### payload.slots -\> [...]

### Alexa Close
Called when a SessionEndedRequest intent is received.
##### payload.type -\> SessionEndedRequest

### Alexa Reply
Sends the response to Alexa
###### Input: payload


## (IV)
There is no 4th step. You're ready to go.
