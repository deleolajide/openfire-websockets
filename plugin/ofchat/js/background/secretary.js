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

    /*
    <iq to="wodemaja@gmail.com/8A058BD3" from="gmail.com" id="7568:serviceDisco" type="result">
        <query xmlns="http://jabber.org/protocol/disco#info">
        <identity category="server" type="im" name="Google Talk"></identity>
        <feature var="http://jabber.org/protocol/disco#info"></feature>
        <feature var="google:jingleinfo"></feature>
        <feature var="google:roster"></feature>
        <feature var="google:nosave"></feature>
        <feature var="google:setting"></feature>
        <feature var="google:shared-status"></feature>
        <feature var="http://jabber.org/protocol/archive#otr"></feature>
        <feature var="google:queue"></feature>
        <feature var="google:mail:notify"></feature>
        <feature var="http://jabber.org/protocol/archive#save"></feature>
        <feature var="http://jabber.org/protocol/rosterx"></feature>
        </query>
    </iq>
     */   
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
    this._connection = new Openfire.Connection(url);

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


        register: function(connection, secretary) {
            this._connection = connection;

            secretary.addHandler('changePresence', this._changePresence);
            secretary.addHandler('send', this._send);
            secretary.addHandler('invite', this._invite);
            secretary.addHandler('acceptInvitation', this._acceptInvitation);
            secretary.addHandler('rejectInvitation', this._rejectInvitation);

            this._connection.addHandler(this._messageCallback, null, 'message');
            this._connection.addHandler(this._presenceCallback, null, 'presence');
        },
        connected: function() {
            this._loadSignedInUser(Strophe.getBareJidFromJid(this._connection.jid));
            this._loadContacts();
        },

        _send: function(parameters) {
            //TODO
            var to = features['xmpp']._toFullJid[parameters.jid] || parameters.jid;
            var threadId = parameters.threadId;
            var message = parameters.message;

            var iq = $msg({to: to, type: 'chat'}).c('body').t(message);

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
            if (jid && jidReg.test(jid) === true) {
                return this._connection.roster.subscribe(jid);
            } else {
                return false;
            }
        },
        _acceptInvitation: function(parameters) {
            var jid = parameters.jid || '';
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

                    var response = {jid: jid.toLowerCase(), name: name || jid.toLowerCase(), avatar: avatar};
                    callback(response);
                }
            );
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
                    var jid = $this.attr('jid').toLowerCase();
                    var name = $this.attr('name') || jid;
                    var invited = !!$this.attr('ask');
                    var rejected = $this.attr('subscription') == 'none';

                    contacts[jid] = {jid: jid, name: name, invited: invited, rejected: rejected};
                });

                boss.report('loadContacts', {contacts: contacts});

                for (index in contacts) {
                    self._loadUser(contacts[index].jid, function(response) {
                        boss.report('loadUser', response);
                    });
                }
                
                boss.log('Signed In');
            });
        },
        _messageCallback: function(message) {
            $message = $(message);

            var jid = $message.attr('from').toLowerCase();
            var from = Strophe.getBareJidFromJid(jid);
            var threadId = $.md5(from.toLowerCase()); // getThreadId;
            var type = $message.attr('type');
            var messageText = $message.children('body').text();

            // ??FullJid
            // todo
            features['xmpp']._toFullJid[from] = jid;
            
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
            if (false && $invite) {
                // group chat invitation
                var invitedFrom = Strophe.getBareJidFromJid($invite.attr('from')).toLowerCase();
                var reason = $invite.find('reason').text();
                boss.report('recievedGroupChatInvitation', {from: invitedFrom, chatroom: from, reason: reason});
            } else {
                // normal chat message
                if (messageText) {
                    boss.showNotification('', from, messageText);
                    boss.report('recieved', {from: from, threadId: threadId, type: type, message: messageText});
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
                            delete features['xmpp']._toFullJid[from];
                        }
                    } else {
                        // ????
                        var $show = $presence.find('show');
                        if ($show.length == 1) {
                            show = $show.text();
                        }
                    }

                    var $status = $presence.find('status');
                    if ($status.length == 1) {
                        status = $status.text();
                    }

                    // todo 
                    if (from !== features['xmpp']._user.jid) {
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
};
