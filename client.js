var socket = io.connect('http://openarena.example.com:8082');
var userList = new Array();
var serverListData = new Array();
var serverListText = new Array();

socket.on('message', recieveMessage);
setInterval(updatePage, 3000);

function recieveMessage(data)
{
	var response = '';
	if(data.type === 'serverList')
	{
		serverListData.push({type: 'serverList', message: data.message});
	}

	updateData();
}

var servers;
var server;
var players;
var player;
var rules;
var rule;
function updateData()
{
	serverListText = [];

	var listData;

	if(serverListData)
	for (var i = 0, maxi = serverListData.length; i < maxi; i++)
	{
		listData = serverListData[i];

		if(listData.type === 'serverList')
		{
			servers = listData.message;

			var str = '';
			var playerCount;

			if(servers)
			for(var j = 1, maxj = servers.length; j < maxj; j++)
			{
				server = servers[j];

				if(getPlayerCount(j) > 0)
				{
					str = '<a href="#" onMouseOver="showServerData('+j+');">';
						str = str + getServerTitle(j);
					str = str + '</a><br>';

					serverListText.push(str);
				}
			}
		}
	}

	serverListData = [];
}

function updatePage()
{
	var element;
	var serverListAreaData = '';

	if(serverListText)
	for (var i = 0, maxi = serverListText.length; i < maxi; i++)
	{
		serverListAreaData = serverListAreaData + serverListText[i];
	}

	if(serverListAreaData !== '')
	{
		element = document.getElementById('serverListArea');
		element.innerHTML = serverListAreaData;
	}
}

function showServerData(serverIdx)
{
	var str = '';

	str = getPlayerData(serverIdx);
	document.getElementById('playerListArea').innerHTML = str;

	str = getRuleData(serverIdx);
	document.getElementById('ruleListArea').innerHTML = str; 

	str = getLevelshotData(serverIdx);
	document.getElementById('levelshot').innerHTML = str; 

	str = getServerMap(serverIdx);
	document.getElementById('otherinfo').innerHTML = str;
}

function getServerTitle(serverIdx)
{
	var str = '';

	server = servers[serverIdx];

	str = str + getPlayerCount(serverIdx)+' '+server.name+' ';

	return str;
}

function getPlayerData(serverIdx)
{
	var str = '';

	server = servers[serverIdx];

	if(server.players)
	players = server.players[0].player;

	if(players)
	for(var k = 0, maxk = players.length; k < maxk; k++)
	{
		player = players[k];
		if(player['ping'] > 0)
		{
			if(player['name'].toString() === '[object Object]')
			{
				str = str + player['score']+' '+'UnnamedPlayer'+' '+player['ping']+'ms<br>';
			}
			else
			{
				str = str + player['score']+' '+player['name']+' '+player['ping']+'ms<br>';
			}
		}
	}

	return str;
}

function getRuleData(serverIdx)
{
	var str = '';

	server = servers[serverIdx];
	rules = server.rules[0].rule;

	str = str + 'Name: '+server.name;
	str = str + '<br>';
	str = str + 'HostName: '+server.hostname;
	str = str + '<br>';
	str = str + 'Address: '+server.address;
	str = str + '<br>';
	str = str + 'Map: '+server.map;
	str = str + '<br>';

	if(rules)
	for(var k = 0, maxk = rules.length; k < maxk; k++)
	{
		rule = rules[k];

		switch(rule['name'].toLowerCase())
		{
			case 'timelimit':
				str = str + 'TimeLimit: '+rule['#'];
				str = str + '<br>';
			break;

			case 'fraglimit':
				str = str + 'Fraglimit: '+rule['#'];
				str = str + '<br>';
			break;

			case 'g_delaghitscan':
				str = str + 'Delagged: '+(rule['#']===1?'Yes':'No');
				str = str + '<br>';
			break;

			case 'pure':
				str = str + 'Pure: '+(rule['#']===1?'Yes':'No');
				str = str + '<br>';
			break;

			case 'sv_dlurl':
				str = str + 'DL URL: '+rule['#'];
				str = str + '<br>';
			break;

			case 'g_rockets':
				str = str + 'RocketsOnly: '+(rule['#']===1?'Yes':'No');
				str = str + '<br>';
			break;

			case 'gamename':
				str = str + 'Gametype: '+rule['#'];
				str = str + '<br>';
			break;

			case 'g_instantgib':
				str = str + 'InstaGib: '+(rule['#']===1?'Yes':'No');
				str = str + '<br>';
			break;

			case 'version':
				str = str + 'Version: '+rule['#'];
				str = str + '<br>';
			break;

			case 'snaps':
				str = str + 'Snaps: '+rule['#'];
				str = str + '<br>';
			break;

			case 'sv_fps':
				str = str + 'Server FPS: '+rule['#'];
				str = str + '<br>';
			break;

			case 'pmove_fixed':
				str = str + 'Move Fixed: '+rule['#'];
				str = str + '<br>';
			break;

			case 'pmove_float':
				str = str + 'Move Float: '+rule['#'];
				str = str + '<br>';
			break;

			case 'move_msec':
				str = str + 'Move MSec: '+rule['#'];
				str = str + '<br>';
			break;
		}
	}

	return str;
}

function getServerName(serverIdx)
{
	server = servers[serverIdx];

	return server.name;
}

function getServerMap(serverIdx)
{
	server = servers[serverIdx];

	return server.map;
}

function getLevelshotData(serverIdx)
{
	var str = '';

	str = '<img id="levelShotImage" src="/img/'+getServerMap(serverIdx)+'.png" onError="setLevelshotPlaceholder();">';

	return str;
}

function getPlayerCount(serverIdx)
{
	server = servers[serverIdx];

	if(server.rules)
	for(var k = 0, maxk = server.rules[0].rule.length; k < maxk; k++)
	{
		if(server.rules[0].rule[k].name.toLowerCase() === 'g_humanplayers')
		{
			return server.rules[0].rule[k]['#'];
		}
	}
}

function setLevelshotPlaceholder()
{
	var str = '';

	str = '<img id="levelShotImage" src="/img/OpenArena-Logo.png">';

	document.getElementById('levelshot').innerHTML = str;
}

