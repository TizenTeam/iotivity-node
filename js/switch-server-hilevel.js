#!/usr/bin/env node
// Copyright 2016 Intel Corporation
// Copyright 2016 Samsung Electronics France SAS
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var sampleUri = "/BinarySwitchResURI";
var sampleResourceType = "oic.r.switch.binary";
var gLogEnabled = false;

function log( object )
{
	if ( gLogEnabled )
		console.log("log: " + object );
}

var myResource, device,
	_ = require( "lodash" ),
	observerCount = 0;

log( "Acquiring OCF device" + sampleUri + "#"  + sampleResourceType );

device = require( "iotivity-node" );
_.extend( device.device, {
	coreSpecVersion: "res.1.1.0",
	dataModels: [ "something.1.1.0" ],
	name: sampleResourceType
} );
_.extend( device.platform, {
	manufacturerName: "Example",
	manufactureDate: new Date( "Tue Dec 20 14:48:07 CET 2016" ),
	platformVersion: "1.1.1",
	firmwareVersion: "0.0.1",
	supportUrl: "https://wiki.tizen.org/wiki/User:Pcoval"
} );

function handleError( theError ) {
	console.error( theError );
	process.exit( 1 );
}

var resourceRequestHandlers = {

	retrieve: function( request ) {
		log( "retrieve" );
		request.respond( request.target ).catch( handleError );
		if ( "observe" in request ) {
			observerCount += Math.max( 0, request.observe ? 1 : -1 );
		}
	},
	create: function( request ) {
		log( "create" );
		request.respond( request.target ).catch( handleError );
		if ( "create" in request ) {
			observerCount += Math.max( 0, request.observe ? 1 : -1 );
		}
	},
	update: function( request ) {
		log( "update" );
		console.log( request.data.value ? "1" : "0" );
		request.target.properties.value = request.data.value;
		request.respond( request.target ).catch( handleError );
		if ( "update" in request ) {
			observerCount += Math.max( 0, request.observe ? 1 : -1 );
		}
	},


};

if ( device.device.uuid ) {

	log( "Registering OCF resource" );

	device.server.register( {
		resourcePath: sampleUri,
		resourceTypes: [ sampleResourceType ],
		interfaces: [ "oic.if.baseline" ],
		discoverable: true,
		observable: true,
		properties: { value: 0 }
	} ).then(
		function( resource ) {
			log( "OCF resource successfully registered" );
			myResource = resource;

			log( " Add event handlers for each supported request type" );
			_.each( resourceRequestHandlers, function( callback, requestType ) {
				log( "each: " + requestType );
				resource[ "on" + requestType ]( function( request ) {
					log( "Received request " + JSON.stringify( request, null, 4 ) );
					callback( request );
				} );
			} );
		},
		function( error ) {
			throw error;
		} );
}
