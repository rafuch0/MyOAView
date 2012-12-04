#!/usr/bin/env node

var DEBUG = { packets: false, normal: true };
var CONFIG = { standalone: true, https: false };

var http = require('http');
var https = require('https');
var io = require('socket.io');
var util = require('util');
var exec = require('child_process').exec;
var fs = require('fs');
var xml2js = require('xml2js');
var path = require('path');

var socketIOClients = {};
var messageQueue = [];

var parseTimer;

var clientCount = 0;

var server;
if(CONFIG.standalone)
{
        if(CONFIG.https)
        {
		var serverCerts = {
		        key: fs.readFileSync('ServerConfig/server.key'),
	        	cert: fs.readFileSync('ServerConfig/server.cert')
		};

                server = https.createServer(serverCerts, ServerMain);
                server.listen('443');
        }
        else
        {
                server = http.createServer(ServerMain);
                server.listen('8082');
        }
}
else
{
        server = http.createServer(serverCerts);
        server.listen('1337');
}

var socket = io.listen(server);
var parser = new xml2js.Parser({explicitRoot: true, explicitArray: true, ignoreAttrs: false, mergeAttrs: true});

setupSocketIOOptions();
setupSocketIOEventHandlers();

function getServerList()
{
	if((clientCount > 0) || (Math.floor(((Math.random()+Math.random())/2)*100) > 90))
	{
		console.log('Master Server List Update Begin');
		console.log('Clients Connected: '+clientCount);

		clearTimeout(parseTimer);

		var child;
		child = exec('/usr/bin/quakestat -cfg ./qstat/qstat.cfg -R -P -H -Hcache ./qstat/hostcache.txt -ne -u -nh -oam dpmaster.deathmask.net -xml -htmlmode -htmlnames -carets -sort hF -of ./qstat/serverlist.xml', parseServerList);
	}
}

function parseServerList()
{
	clearTimeout(parseTimer);

	fs.readFile('./qstat/serverlist.xml', function(err, data)
	{
		parser.parseString(data, function(err, result)
		{
			if(result)
			{
				queueMessage({type: 'serverList', message: result.qstat.server});
				console.log('Master Server List Parsing Complete');
			}
			else
			{
				console.log('Master Server List Currently Parsing');
			}
		});
	});
}

setInterval(
		function()
		{
			getServerList();
		}
	, 30000);

//getServerList();

setInterval(broadcastMessages, 1000);

function getContentType(uri)
{
        var extension = uri.substr(-3);

        switch(extension)
        {
                case 'htm':
                case 'tml':
                        return 'text/html';
                break;

                case 'css':
                        return 'text/css';
                break;

                case '.js':
                        return 'text/javascript';
                break;
        }
}

function ServerMain(request, response)
{
        var request_uri = './www-root'+path.normalize(((request.url == '' || request.url == '/')?'/index.html':request.url));

        fs.exists(request_uri, function(exists)
        {
                if(exists)
                {
                        fs.readFile(request_uri, function(error, content)
                        {
                                if(error)
                                {
                                        response.writeHead(500);
                                        response.end();
                                }
                                else
                                {
                                        response.writeHead(200, { 'Content-Type': getContentType(request_uri) });
                                        response.end(content, 'utf-8');
                                }
                        });
                }
                else
                {
                        response.writeHead(404);
                        response.end();
                }
        });
}

function setupSocketIOEventHandlers()
{
	socket.on('connection', createSocketIOClient);
}

function setupSocketIOOptions()
{
	socket.enable('browser client minification');
	socket.enable('browser client etag');
	socket.enable('browser client gzip');
	socket.set('log level', 0);
	if(DEBUG.normal) socket.set('log level', 3);
	socket.set('transports',
		[
			'websocket',
			//'flashsocket',
			'htmlfile',
			'xhr-polling',
			'jsonp-polling'
		]
	);
}

function removeSocketIOClient()
{
	clientCount = clientCount - 1;
}

function createSocketIOClient(client)
{
	client.on('disconnect', removeSocketIOClient);
	client.join('general');

	clientCount = clientCount + 1;

	if(DEBUG.normal) console.log('Client %s Connected', clientCount);

	parseTimer = setTimeout(parseServerList, 1000);
}

function queueMessage(data)
{
	messageQueue.push(data);
}

function broadcastMessages()
{
	if(messageQueue.length > 0)
	{
		for(message in messageQueue)
		{
			socket.sockets.in('general').volatile.emit('message', messageQueue[message]);
		}

		messageQueue = [];
	}
}
