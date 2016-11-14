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

var sampleUri = "/LineResURI";
var sampleResourceType = "line";
var serverHost = "fe80::d040:DEAD:BEEF:FEED%wlan0";
var serverPort = 56789;
var useIotivityContrained = true;

var intervalId,
handleReceptacle = {},
iotivity = require( "iotivity-node/lowlevel" ),
options = ( function() {
    var index,
    returnValue = {
        // By default we discover resources
        discoveryUri: iotivity.OC_MULTICAST_DISCOVERY_URI
    };

    for ( index in process.argv ) {
        if ( process.argv[ index ] === "-d" || process.argv[ index ] === "--device" ) {
            returnValue.discoveryUri = iotivity.OC_RSRVD_DEVICE_URI;
        } else if ( process.argv[ index ] === "-p" || process.argv[ index ] === "-platform" ) {
            returnValue.discoveryUri = iotivity.OC_RSRVD_PLATFORM_URI;
        }
    }

    return returnValue;
} )();


function discovery()
{
    console.log( "Issuing discovery request" );
    // Discover resources and list them
    iotivity.OCDoResource(

        // The bindings fill in this object
        handleReceptacle,

        iotivity.OCMethod.OC_REST_DISCOVER,

        // Standard path for discovering resources
        iotivity.OC_MULTICAST_DISCOVERY_URI,

        // There is no destination
        null,

        // There is no payload
        null,
        iotivity.OCConnectivityType.CT_DEFAULT,
        iotivity.OCQualityOfService.OC_HIGH_QOS,
        function( handle, response ) {
            console.log( "Received response to DISCOVER request:" );
            console.log( JSON.stringify( response, null, 4 ) );
            var index,
            destination = response.addr,
            postHandleReceptacle = {},
            resources = response && response.payload && response.payload.resources,
            resourceCount = resources ? resources.length : 0,
            postResponseHandler = function( handle, response ) {
                console.log( "Received response to POST request:" );
                console.log( JSON.stringify( response, null, 4 ) );
                return iotivity.OCStackApplicationResult.OC_STACK_DELETE_TRANSACTION;
            };
            console.log( "#destination=" + JSON.stringify( destination, null, 4 ) );
            console.log( "#resources=" + JSON.stringify(resources) );

            // If the sample URI is among the resources, issue the POST request to it
            var value = "This is a line of text";
            for ( index = 0; index < resourceCount; index++ ) {
                if ( resources[ index ].uri === sampleUri ) {
                    iotivity.OCDoResource(
                        postHandleReceptacle,
                        iotivity.OCMethod.OC_REST_POST,
                        sampleUri,
                        destination,
                        {
                            type: iotivity.OCPayloadType.PAYLOAD_TYPE_REPRESENTATION,
                            values: {
                                value: value
                            }
                        },
                        iotivity.OCConnectivityType.CT_DEFAULT,
                        iotivity.OCQualityOfService.OC_HIGH_QOS,
                        postResponseHandler,
                        null );
                }
            }

            return iotivity.OCStackApplicationResult.OC_STACK_KEEP_TRANSACTION;
        },

        // There are no header options
        null );
}


function post(value)
{
    console.log( "post: value=" + value + "\n" );

    destination = JSON.parse('{ \
"adapter": 1, \
"flags": 32, \
"ifindex": 0, \
"port": ' + serverPort + ','  + '"addr": "' + serverHost + '"' + "}" );

    var resources;
    if ( useIotivityContrained )  {
        resources = JSON.parse('\
[{"uri":"/oic/p",\
"types":["oic.wk.p"],\
"interfaces":["oic.if.r","oic.if.baseline"],"bitmap":1,"secure":false,"port":0},\
{"uri":"/oic/d","types":["' + sampleResourceType+ '"],\
"interfaces":["oic.if.r","oic.if.baseline"],"bitmap":1,"secure":false,"port":0},\
{"uri":"' + sampleUri + '","types":["' + sampleResourceType +'"],\
"interfaces":["oic.if.rw","oic.if.baseline"],"bitmap":3,"secure":false,"port":0}]');
    } else {
        JSON.parse('\
[{"uri":"/oic/sec/doxm",\
"types":["oic.r.doxm"],\
"interfaces":["oic.if.baseline"],"bitmap":1,"secure":false,"port":0},\
{"uri":"/oic/sec/pstat","types":["oic.r.pstat"],\
"interfaces":["oic.if.baseline"],"bitmap":1,"secure":false,"port":0},\
{"uri":"/oic/d","types":["oic.wk.d"],\
"interfaces":["oic.if.baseline","oic.if.r"],"bitmap":1,"secure":false,"port":0},\
{"uri":"/oic/p","types":["oic.wk.p"],\
"interfaces":["oic.if.baseline","oic.if.r"],"bitmap":1,"secure":false,"port":0},\
{"uri":"/oic/ping","types":["oic.wk.ping"],\
"interfaces":["oic.if.baseline","oic.if.rw"],"bitmap":1,"secure":false,"port":0},\
{"uri":"' + sampleUri+ '","types": ["' + sampleResourceType + '"],\
"interfaces":["oic.if.baseline"],"bitmap":3,"secure":false,"port":0}]');
    }
    resourceCount = resources ? resources.length : 0;

    console.log( "destination=" + JSON.stringify( destination, null, 4 ) );
    postHandleReceptacle = {};
    postResponseHandler = function( handle, response ) {
        console.log( "Received response to POST request:" );
        console.log( JSON.stringify( response, null, 4 ) );
        return iotivity.OCStackApplicationResult.OC_STACK_DELETE_TRANSACTION;
    }


    // If the sample URI is among the resources, issue the POST request to it
    for ( index = 0; index < resourceCount; index++ ) {
        if ( resources[ index ].uri === sampleUri ) {
            iotivity.OCDoResource(
                postHandleReceptacle,
                iotivity.OCMethod.OC_REST_POST,
                sampleUri,
                destination,
                {
                    type: iotivity.OCPayloadType.PAYLOAD_TYPE_REPRESENTATION,
                    values: {
                        value: value
                    }
                },
                iotivity.OCConnectivityType.CT_DEFAULT,
                iotivity.OCQualityOfService.OC_HIGH_QOS,
                postResponseHandler,
                null );
        }
    }

    return iotivity.OCStackApplicationResult.OC_STACK_KEEP_TRANSACTION;
}

console.log("{ main")

console.log(process.argv);

intervalId = setInterval( function() {
    iotivity.OCProcess();
}, 1000 );


var discoveryEnabled = true;

if (process.argv.length > 2) {
    discoveryEnabled = false ;
    serverHost = process.argv[2];
}

if ( process.argv.length > 3)
    serverPort = process.argv[3];


console.log( "Starting OCF stack in client mode" );
iotivity.OCInit( null, 0, iotivity.OCMode.OC_CLIENT );


// Start iotivity and set up the processing loop
iotivity.OCInit( null, 0, iotivity.OCMode.OC_CLIENT );

intervalId = setInterval( function() {
    iotivity.OCProcess();
}, 1000 );

if ( discoveryEnabled ) {
    console.log("# post on Discovery, can be posted without with args : destination port")
    discovery();
} else {
    var value = "";
    setInterval(
        function(){
            value = (new Date()).toString();
            post(value);
            value = !value;
        },
        2*1000);
}

console.log("} main")
