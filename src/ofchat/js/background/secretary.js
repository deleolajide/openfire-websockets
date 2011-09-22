/** 
 * secretary???boss?????bosh?? (strophejs)
 * @required strophe.js
 *
 */
 
var secretary = {};

secretary._connection = null;
secretary._timeout = null;
secretary._signingOut = false;  //??????

secretary.active = false;  // Strophe?????????disconnected?timedout????????

secretary._loadFeatures = function(parameters) {
    var service = this._connection.domain;
    var node = null;
    var self = this;

    this._connection.disco.discoverInfo(service, node, function(result) {
        $(result).find('feature').each(function(index, element) {
            var featureName = $(element).attr('var');
            if (typeof(self._connection.disco.features) == 'undefined') {
                self._connection.disco.features = [];
            }

            self._loadFeature(featureName);
        });
    }); 
};

secretary._loadFeature = function(featureName) {
    if (typeof(features[featureName]) !== 'undefined' && features[featureName].register) {
        features[featureName].register(this._connection, this);
    }
}

secretary._connected = function() {
    for (index in features) {
        if (features[index].connected) {
            features[index].connected();
        }
    }
};

secretary.reset = function() {
    if (this._connection) {
        this._connection.reset();
    }
};

secretary.signin = function() {
    var service = boss.options('BOSH_SERVICE');
    var jid = boss.options('JID');
    var password = boss.options('PASSWORD');

	this._connect(service, jid, password);
};

secretary.signout = function() {
    if (this._connection) {
        this._connection.disconnect('logout');
    }
    this.active = false;
};

secretary._connectTimeoutHandler = function() {
    this._clearConnectTimeout();

    var timeout = 30000;
    var self = this;
    this._timeout = setTimeout(function() {
        boss.log('<div class="gtalklet_clear">Timed Out [<a class="gtalklet_retry">Retry</a>]...</div>', 'error');
        self.active = false;
        // ?????block
        //boss.report('connectError', {});
        self.signout();
    }, timeout);
};

secretary._clearConnectTimeout = function() {
    if (typeof(this._timeout) !== 'undefined') {
        clearTimeout(this._timeout);
    }
};

secretary.addHandler = function(handlerName, handler) {
    secretary[handlerName] = handler;
};

secretary._connect = function(url, jid, password) {
    var self = this;  
    
    if (boss.options('USE_WEBSOCKETS'))
	this._connection = new Openfire.Connection(url);    
    else    
    	this._connection = new Strophe.Connection(url);

    try {
  
        this._connection.connect(jid, password, function(status) {
            switch (status) {
                case Strophe.Status.CONNECTING:
					boss.log('<div class="gtalklet_clear" title="' + url + '">Connecting...</div>');

                    //?????connecting?????, ????
                    if (!self.active) {
                        self.active = true;
                        self._connectTimeoutHandler();
                    }

                    boss.report('connecting', {});
                    break;
                case Strophe.Status.AUTHENTICATING:
                    boss.log('<div class="gtalklet_clear" title="' + jid + '">Authenticating...</div>');
                    self.active = true;
                    self._connectTimeoutHandler();
                    break;
                case Strophe.Status.CONNECTED:
                    boss.log('Connected');

                    self.active = true;
                    self._clearConnectTimeout();

                    // connected ??????
                    // ??xmpp????
                    self._loadFeature('xmpp');
                    // ?????xmpp??
                    self._loadFeatures();

                    self._connected();
                    break;
                case Strophe.Status.DISCONNECTING:
                    self.active = true;

                    self._signingOut = true;
                    self._connectTimeoutHandler();
                    break;
                case Strophe.Status.DISCONNECTED:
                    //boss.log('Disconnected');
                    self.active = false;

                    if (self._signingOut) {
                        // ??
                        self._clearConnectTimeout();
                    } else {
                        // ????Disconnecting???????
                        // ??
                    }

                    self._signingOut = false;
                    boss.report('connectError', {});
                    break;
                case Strophe.Status.CONNFAIL:
                    boss.log('Connection Failed', 'error');
                    self.active = false;
					boss.report('connectError', {});
                    self._connection.disconnect('logout');
                    break;
                case Strophe.Status.AUTHFAIL:
                    boss.log('Authentication Failed', 'error');
                    self.active = false;
					boss.report('connectError', {});
                    self._connection.disconnect('logout');
                    break;
                case Strophe.Status.ERROR:
                    boss.log('Something Error', 'error');
                    self.active = false;
					boss.report('connectError', {});
                    self._connection.disconnect('logout');
                    break;
                default:
                    boss.log('Something Error', 'error');
                    self.active = false;
					boss.report('connectError', {});
                    self._connection.disconnect('logout');
                    //pass
                    break;
            }
       }, 60, 1);
    } catch (error) {
        console.dir(error);
    }
};

var features = {
    /**
     * xmpp ???? ???????????
     * @implements register
     * @implements connected
     *
     * @provides send
     * @provides changePresence
     */
    'xmpp': {
        _connection: null,
        that: this,

        _toFullJid: {}, // ??bareJid fullJid??
        _user: {},  // ???????

        _now: function(timestamp) 
        {
            var now = new Date();
            
            if (timestamp) {
                return now.getTime();
            } else {
                return now.toLocaleTimeString();
            }
        },

	_getXMPPDate: function(xmppDate) 
	{
		var temp = xmppDate.split("T");				
		var myDate = temp[0].split("-");
		var myTime = temp[1].split(":");

		return new Date(myDate[0], myDate[1] - 1, myDate[2], myTime[0], myTime[1], myTime[2].split(".")[0], 0);
	},
		
        register: function(connection, secretary) {
            this._connection = connection;

	    console.log("registering..xmpp");	
		
	    Strophe.addNamespace('PRIVATE', 'jabber:iq:private');
	    Strophe.addNamespace('BOOKMARKS', 'storage:bookmarks');
	    Strophe.addNamespace('PRIVACY', 'jabber:iq:privacy');
	    Strophe.addNamespace('DELAY', 'jabber:x:delay');
            Strophe.addNamespace('DISCO_ITEMS', "http://jabber.org/protocol/disco#items");
            Strophe.addNamespace('DISCO_INFO',  "http://jabber.org/protocol/disco#info");			
            
            secretary.addHandler('changePresence', this._changePresence);
            secretary.addHandler('send', this._send);
            secretary.addHandler('invite', this._invite);
            secretary.addHandler('acceptInvitation', this._acceptInvitation);
            secretary.addHandler('rejectInvitation', this._rejectInvitation);

            this._connection.addHandler(this._messageCallback, null, 'message');
            this._connection.addHandler(this._presenceCallback, null, 'presence');
            this._connection.addHandler(this._rosterCallback, Strophe.NS.ROSTER, 'iq');
            this._connection.addHandler(this._bookmarksCallback, Strophe.NS.PRIVATE, 'iq');
            
        },
        connected: function() {
            this._loadSignedInUser(Strophe.getBareJidFromJid(this._connection.jid));    
            this._loadContacts();              
        },

	_autojoin: function() {
               
	    var iq = $iq({to: this._connection.domain, type: 'get'}).c('query', {xmlns: Strophe.NS.PRIVATE}).c('storage', {xmlns: Strophe.NS.BOOKMARKS});	    	    
            this._connection.sendIQ(iq);           
	},
		
        _send: function(parameters) {
            //TODO
            
            var threadId = parameters.threadId;
            var message = parameters.message;

	    var threads = $.grep(state.threads, function(e, i) {return e.id === threadId});
            var thread = threads[0];
            
            if (!thread.chatType) thread.chatType = "chat";
            
            if (thread.chatType == "chat") 
            	var to = features['xmpp']._toFullJid[parameters.jid]; // || parameters.jid;
            else
            	var to = parameters.jid;
            
            var iq = $msg({to: to, type: thread.chatType}).c('body').t(message);

            this._connection.send(iq);
        },
        _changePresence: function(parameters) {
            var show = '';
            var status = '';
            if (parameters) {
                show = parameters.show;
                status = parameters.status;
            }

            var iq = $pres();
            if (show) {
                if (status) {
                    iq = iq.c('show').t(show).up().c('status').t(status);
                } else {
                    iq = iq.c('show').t(show);
                }
            }
            
            this._connection.send(iq);
        },
        _invite: function(parameters) {
            var jid = parameters.jid || '';
            var jidReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            //if (jid && jidReg.test(jid) === true) {

            if (jid && jid.indexOf("@") > - 1) 
            {            
                return this._connection.roster.subscribe(jid);
                
            } else {
                return false;
            }
        },
        _acceptInvitation: function(parameters) {
            var jid = parameters.jid || '';    
            
            this._connection.roster.subscribed(jid);            
            return this._connection.roster.subscribe(jid);
        },
        _rejectInvitation: function(parameters) {
            var jid = parameters.jid || '';
            return this._connection.roster.unsubscribed(jid);
        },
        _loadSignedInUser: function(jid) {
            // http://xmpp.org/extensions/xep-0054.html
            // http://xmpp.org/extensions/xep-0153.html
            this._loadUser(jid, function(response) {
                boss.report('connected', {jid: response.jid.toLowerCase(), name: response.name, avatar: response.avatar});
            });

            this._changePresence();
        },
        _loadUser: function(jid, callback) {
            // http://xmpp.org/extensions/xep-0054.html
            // http://xmpp.org/extensions/xep-0153.html
            var resultUser = {};
            var iq = $iq({type: 'get', to: jid}).c('vCard', {xmlns: 'vcard-temp'});

            this._connection.sendIQ(iq,
                function(response){
                    var $response = $(response);
                   
                    var name = $response.find('vCard FN').text();
                    var $photo = $response.find('vCard PHOTO');
                    var avatar = 'data:' + $photo.find('TYPE').text() + ';base64,' + $photo.find('BINVAL').text();
                    var response = {jid: jid.toLowerCase(), name: name, avatar: avatar};                    
                    callback(response);
                }
            );
        },
        
        _loadMessages: function(jid, callback) {
            // http://xmpp.org/extensions/xep-0136.html - archiving
            
            var historyChats = 2;            
            var resultUser = {};
            var iq = $iq({type: 'get'}).c('list', {xmlns: 'urn:xmpp:archive', 'with': jid}); //.c('set', {xmlns: 'http://jabber.org/protocol/rsm'}).c('max').t('2');

            this._connection.sendIQ(iq, function(response)
            {
                var $response = $(response);
                var nCount = 0;
                var chats = $('chat', response);
                var historyCount = historyCount + chats.size();

		$(chats).each(function() 
		{
		    nCount++;

		    if (historyChats + nCount >= chats.size()) 
		    {		
			    var item = $(this);
			    var party = item.attr('with');
			    var threadId = $.md5(party.toLowerCase());
			    var start = item.attr('start');
			    var chatDate = features['xmpp']._getXMPPDate(start);		    

			    var iq = $iq({type: 'get', to: jid}).c('retrieve', {xmlns: 'urn:xmpp:archive', 'with': party, start: start});

			    features['xmpp']._connection.sendIQ(iq, function(response)
			    {
				var $response = $(response);

				$('chat', response).each(function() 
				{		
					var chatwith = $(this);
					$(chatwith).children().each(function() 
					{			
					    var chat = $(this);

					    if (this.nodeName == "to")
					    {
						var secs = $(chat).attr('secs');
						var body = $(chat).find('body').text();	
						var from = state.user.jid;

					    } else {
						var secs = $(chat).attr('secs');
						var body = $(chat).find('body').text();	
						var from = jid;
					    }

					    var time = chatDate.toLocaleTimeString();
					    var timestamp = chatDate.getTime() + (secs * 1000);

					    var response = {direction: this.nodeName, from: from, threadId: threadId, type: 'chat', message: body, jid: party, time: time, timestamp: timestamp, newMsg: false}
					    callback(response);
					});
				});
			    });
		     }
		    
                });
            });
        },        
        _loadContacts: function() {
            boss.log('Loading Contacts...');

            var self = this;
            this._connection.roster.requestRoster(function(rosters){
                var contacts = {};
                $(rosters).find('item').each(function() {
                    //<item name="Sean Zheng" jid="i@icelink.me" subscription="both"></item>
                    //<item ask="subscribe" jid="i@icelink.me" subscription="none"></item>
                    //<item jid="i@miy.im" subscription="none"/> ???
                    
                    $this = $(this);
                    var jid = Strophe.getBareJidFromJid($this.attr('jid')).toLowerCase();
                    var name = $this.attr('name') || Strophe.getNodeFromJid(jid);
                    var invited = !!$this.attr('ask');
                    var rejected = $this.attr('subscription') == 'none';

                    contacts[jid] = {jid: jid, name: name, invited: invited, rejected: rejected};
                });

                boss.report('loadContacts', {contacts: contacts});

                for (index in contacts) 
                {              
                    self._loadUser(contacts[index].jid, function(response) {
                        boss.report('loadUser', response);
                    });

                    self._loadMessages(contacts[index].jid, function(response) {
                  
                  	if (response.direction == "from")
                        	boss.report('recieved', response);
                        else
				boss.report('send', response);                        
                    }); 
                   
                }
                
                boss.log('Signed In');
                
                features.xmpp._autojoin();
            });
        },

        _bookmarksCallback: function(msg) 
        { 
		$('conference', msg).each(function() 
		{		
			var item = $(this);

			if(item.attr('autojoin') == "true") 
			{
				var jid = item.attr('jid');			
				var from = Strophe.getBareJidFromJid(jid);				
				
				var contacts = {};
				var name = item.attr('name');
				var avatar = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAgACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6E+LPjLUNIuoPD2izLbaldQ+cbl4wwijyVG0EY3EgnJyBt5BzXkFl4k1u08YbLy6+1Xsrgx3vCyR/Lg5CDDD2469cZpnxy8ZWWs+O0l0XfjT4TZSTk7TK6yNu2jOCoPAPUlm7AZr/AApv7S5vr2+v42eUBMeYBuQfMDx2ydtfEZti5yru0tFt5Hv5c6Ps1H7TPVE8Ya3F5Miasblo2HmQSQJFvHocqCoPTNehaFr1vqllBdQnCzoHCsMEZHSvAvGWsW9rBPfwyiAIMI5HGTnHQ1u/BrxWNWsUUFUkt2Ecsa5wvGRjPPT9QR2r0OH8TWrSm5yvHpfv/kGa4JU6SqRjbuec+Ofhb4r0PWbtYbZryxHzQ3aFAsi5OAVLZDAAZGMdwTzXEWN7PpmpGVPkuomKvjg7u6ntkdK+5NasFvLZkPGVIrxXxl8INKu72a+imubaSQgsI9hUnjnDIcH6V9NleEweEqznUhzcys76o+XxVOpOzpys0eS/FLVtP1PxTJY6YJF0yNkjgkJMhb5Qd4Dcg5bp7YrqPgbZ3NhCLyVgTdRptUfwqC5HPvv6emKkf4WWqThpbm5mVT90xxKG9jhBXoHhDw99nMSLGkaJgAAYwOa7MS8K4xjh4W5fK33muGq4qMZxqTupWb9Uf//Z";
				var presence = { type: state.PRESENCE_TYPE.CHAT,  message: state.PRESENCE_MESSAGE[state.PRESENCE_TYPE.CHAT]};
				
				contacts[jid] = {jid: jid, name: name, invited: false, rejected: false, presence: presence, avatar: avatar};
				
				boss.report('loadContacts', {contacts: contacts});				
				
				features.xmpp._connection.sendIQ($iq({type: 'get', from: state.user.jid, to: jid}).c('query', {xmlns: Strophe.NS.DISCO_INFO}));									
				features.xmpp._connection.muc.join(jid, Strophe.getNodeFromJid(state.user.jid));							
			}
		});
		
		return true;	    	    
        },
        
        _rosterCallback: function(roster) {
            $roster = $(roster);
            var from = Strophe.getBareJidFromJid($roster.attr('from')).toLowerCase();  
	    
	    // TODO new contacts

	    return true;
        },
        
        _messageCallback: function(message) {

            $message = $(message);

            var jid = $message.attr('from').toLowerCase();
            var from = Strophe.getBareJidFromJid(jid);
            var threadId = $.md5(from.toLowerCase()); // getThreadId;
            var type = $message.attr('type');
            var messageText = $message.children('body').text();
            var time = features['xmpp']._now();
            var timestamp = features['xmpp']._now(true);
            
            
            // ??FullJid
            // todo
            
            //features['xmpp']._toFullJid[from] = jid;
            
            //offline
            var $error = $message.children('error');
            if ($error.length) {
                type = 'error';
                //var errorCode = $error.attr('code');
                //var errorType = $error.attr('type');
                //var errorMessage = $error.children().first().get(0).tagName;
                //messageText = from + ' ' + errorCode + ' ' + errorType + ' ' + errorMessage;
                messageText = from + ' is offline and can\'t receive messages right now.';
            }
            
            var $invite = $message.find('invite');
            
            if (false && $invite) 
            {
                // group chat invitation
            
            	var invitedFrom = Strophe.getBareJidFromJid($invite.attr('from')).toLowerCase();
                var reason = $invite.find('reason').text();
                boss.report('recievedGroupChatInvitation', {from: invitedFrom, chatroom: from, reason: reason});
                
            } else {
                // normal chat message
                
                var showMessage = true;
                
                if (messageText) 
                {                
                    if (type == "chat") 
                    {
                    	boss.showNotification('', from, messageText);
                    
                    } else {
                    
			var mucNick = Strophe.getResourceFromJid(jid);
			var thisNick = Strophe.getNodeFromJid(state.user.jid);
			
			if (mucNick == thisNick) showMessage = false;
		    }
		      
                    if (showMessage) boss.report('recieved', {from: from, threadId: threadId, type: type, message: messageText, jid: jid, time: time, timestamp: timestamp, newMsg: true});
                }
            }

            return true;
        },
        _presenceCallback: function(presence) {
            $presence = $(presence);

            var from = Strophe.getBareJidFromJid($presence.attr('from')).toLowerCase();
            var show = 'chat', status = '';

            var type = $presence.attr('type');
            switch (type) {
                case 'subscribe':
                    // ?????????
                    var threadId = $.md5(from.toLowerCase()); // getThreadId;
                    var type = 'invite'; //?
                    var messageText = from + ' wants to add you as a friend. Add as a friend? <a class="gtalklet_message_link gtalklet_invited_ok" href="javascript:" data-jid="' + from + '" title="Accept">Yes</a> | <a class="gtalklet_message_link gtalklet_invited_no" href="javascript:" data-jid=' + from + ' title="Reject">No</a>'; //?

                    boss.report('recieved', {from: from, threadId: threadId, type: type, message: messageText, html: true});
                    boss.report('disableThread', {threadId: threadId});
                    break;
                case 'subscribed':
                    // ???????????
                    var jid = from;
                    var name = jid;
                    var contacts = {};
                    contacts[jid] = {jid: jid, name: name, rejected: false};
                    boss.report('loadContacts', {contacts: contacts});
                    break;
                case 'unsubscribe':
                    // ?????????
                    break;
                case 'unsubscribed':
                    // ???????????
                    var jid = from;
                    var name = jid;
                    var contacts = {};
                    contacts[jid] = {jid: jid, name: name, rejected: true};
                    boss.report('loadContacts', {contacts: contacts});
                    break;
                case 'probe':
                    // ????
                    break;
                case 'error':
                    break;
                case 'unavailable':
                default:
                    if (type) {
                        // ?????unavailable
                        show = 'unavailable';
                        // ?FullJid?????resource
                        if (features['xmpp']._toFullJid[from]) {
                            //delete features['xmpp']._toFullJid[from];
                        }
                    } else {
                        // ????
                        var $show = $presence.find('show');
                        if ($show.length == 1) {
                            show = $show.text();
                        }
                        
                        features['xmpp']._toFullJid[from] = $presence.attr('from');
                    }

                    var $status = $presence.find('status');
                    if ($status.length == 1) {
                        status = $status.text();
                    }

                    // todo 
                    if (from !== features['xmpp']._user.jid) {
                    
			if (!state.user.contacts[from])
			{
                    	    var jid = from;
                    	    var name = jid;			
			    var contacts = {};
			    var presence = {
				type: show,
				message: status
			    };
                              
			    contacts[jid] = {jid: jid, name: name, invited: false, rejected: false, presence: presence};
			    boss.report('loadContacts', {contacts: contacts});				    
			
			} else 
				boss.report('presence', {from: from, show: show, status: status});
                        
                        
                    }
            }
            
            return true;
        }
    },
    'google:jingleinfo' : {
        register: function(connection) {
        } 
    },
    'google:roster': {
        register: function(connection) {
        } 
    },
    'google:nosave': {
        register: function(connection) {
        } 
    },
    'google:setting': {
        register: function(connection) {
        } 
    },
    'google:shared-status': {
        register: function(connection) {
        } 
    },
    'google:mail:notify': {
        register: function(connection) {
        },
    },
    'google:queue': {
        register: function(connection) {
        } 
    },
    'http://jabber.org/protocol/archive#otr':{
        register: function(connection) {
        } 
    },
    'http://jabber.org/protocal/archive#save': {
        register: function(connection) {
        }
    },
    
    'http://jabber.org/protocal/rosterx': {
    },
    
    'urn:xmpp:archive:manage': {
        register: function(connection, secretary) 
        {
		console.log("registering..urn:xmpp:archive:manage");		
		this._connection = connection;
		this._secretary = secretary;        
        }
    }, 
    
    'urn:xmpp:archive:auto': {
        register: function(connection, secretary) 
        {		
		console.log("registering..urn:xmpp:archive:auto");
		this._connection = connection;
		this._secretary = secretary;		
        }
    }     
};
