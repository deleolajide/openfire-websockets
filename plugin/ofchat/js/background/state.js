state = {};
state.MAX_MESSAGES = 30;
state.PANEL_STATE = {
                     NORMAL: 'normal',
                     EXPANDED: 'expanded',
                     MINIMIZED: 'minimized',
                     COLLAPSED: 'collapsed'
                    };
state.PANEL_TYPE = {
                    CHAT: 'chat',
                   };
state.PRESENCE_TYPE = {
                       UNKNOWN: 'unknown',
                       INVITED: 'invited',
                       REJECTED: 'rejected',
                       UNAVAILABLE: 'unavailable',
                       DND: 'dnd',
                       XA : 'xa',
                       AWAY: 'away',
                       CHAT: 'chat',
					   ERROR: 'unavailable'
                      };
state.PRESENCE_MESSAGE = {
                          unknown: 'Unknown',
                          invited: 'Invited',
                          rejected: 'Rejected',
                          unavailable: 'Offline',
                          dnd: 'Busy',
                          xa: 'Idle',
                          away: 'Idle',
                          chat: 'Available',
						  error: 'Offline'
                         };
state.PRESENCE_TYPE_ARRAY = [
                            'unknown',
                            'unavailable',
                            'dnd',
                            'xa',
                            'away',
                            'chat'
                            ];
state.MESSAGE_TYPE = {
                      TIME: 'time',
                      INVITE: 'invite',
                      CHAT_SENT: 'chat_sent', 
                      CHAT: 'chat_recieved',
                      NORMAL : 'normal',
                      GROUPCHAT: 'groupchat',
                      HEADLINE: 'headline',
                      ERROR : 'error'
                     };
state.CONSOLE_COMMANDS = {
                        EMPTY: [
                        ],
                        SIGNIN: [{
                            classes: 'chat signin',
                            title: 'Sign In'
                        }],
                        COMPLETE: [
                            {
                                classes: 'signout',
                                title: 'Sign Out'
                            },
                            {
                                classes: 'chat',
                                title: 'Available'
                            },
                            {
                                classes: 'away',
                                title: 'Away'
                            },
                            {
                                classes: 'dnd',
                                title: 'Busy'
                            }
                        ]
                        };

state.INVITATION_STATE = { //邀请状态, 未发送邀请|已发送邀请|jid非法
    NORMAL: '',
    INVITED: 'invited',
    INVALID: 'invalid',
};

var defaultState =  {
    user: {   // 初始，未登录
          signedin: false,  // 是否登录
          dropped: false,  // 是否掉线
          jid: '',
          name: '',
          presence: {
              type: state.PRESENCE_TYPE.UNAVAILABLE,
              message: state.PRESENCE_MESSAGE[state.PRESENCE_TYPE.UNAVAILABLE]
          },
          //avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAa9JREFUeNqcU8tKw1AQzU1v0retJSUQsgq4KEVwJy4F8TO6saviwg9wLbgRd7qouOp/iCs/QXAlpIFCaWkobfP2TEgkDQUfA4fMnce5M3MnLIoiIZVut5uqOtAHesl5BAyBTyEnLEvQ6XTos8cYMzVNK7ZaLYkMs9nMsyzLQSwR21kCMXsIw5AwaLfbcqVSkefzOSOQTjb4+knMN7YIgiAgXFDCcrlMzwLp5XJZgt5LbSl4ngCyv9lstlojcRyHwa/kZ7CL4B0EJ5IkbVXneV4I/0eeYFcLTxiaky8Vs3DxHf6mhefFYnGIFgZ4hSIZkOzA9pg8548VxFWsVis/nTRagikY5W8n5AkOgFtRFN/o2dKgZrPJsRsv0G8AI0sQT7vRaKjIv+ScX+m6LiuKIq/XawFVxMTValUolUrRdDr1TNN0fd+/h/kBsBicR7jxFYlFVVUlJDJKzj8jKhCwHzHRZDLxxuMxDfW8ALk2DOO4Xq/LGBRzXTdO3gXy0QWILdRqNYaKOMeQzlABt21b+K1QLPaEck85ytDQE6Np/0WwWPFmojV2l/y6/5HhlwADAB9vYrbjcbkvAAAAAElFTkSuQmCC',  // 默认头像
          avatar: '',
          contacts: {} // 联系人 
    },
    ui: {
        css: '',
        path: chrome.extension.getURL(''),
        console: {
            state: state.PANEL_STATE.COLLAPSED,
            commands: state.CONSOLE_COMMANDS.EMPTY
        },
        pendingThreads: [],  // 待接收的新会话threadId
        log: {
            message: '',
            level: '' //  DEBUG INFO WARN ERROR
        },
        filter: {
            state: state.PANEL_STATE.COLLAPSED,  // 新会话面板状态 collapsed | expand
            filter: '',    // 用户filter文本框中的内容
            matchedContacts: [], // 匹配的用户
            matchedContactsSum: 0, //匹配的用户总数
            invite: state.INVITATION_STATE.NORMAL,  //邀请状态, 未发送邀请|已发送邀请|jid非法
        },
        blocked : false
    },
    threads: [ //初始，没有聊天线程
        {
            prototype: 'prototype',
            id: 'prototype',
            user: {
                name: '',
                jid: '',
                presence: {
                    type: '', 
                    message: ''
                }
            },
            ui: {
                type: state.PANEL_TYPE.CHAT,  //线程类型 chat | invited | ...
                state: '',    //面板的状态, minimized | normal |...
                height: '',
                width: '',
                scrollTop: 0, // 滚动位置
                unread: '',
                lastActivity: '',  // 最近活动时间
                messagebox : {
                    typing: '',    //消息框中的内容
                    height: 32, //16
                    disabled: false
                }
            },
            messages: [  //线程中的消息
            {
                prototype: 'prototype',
                type: '',       //消息类型，chat_sent | chat_recieved | status 之类
                from: '',    //消息来源，jid; 没有from表示自己或系统消息（根据type）
                time: '',       //发消息的时间
                timestamp: '',
                showTime : true,
                content: ''     //消息内容
            }
            ]
        }
   ]
};

$.extend(true, state, defaultState);

$.extend(state, {
    optionUpdated: function(name, value) {
        var stateChange = {report: name, returns: {}};
        switch(name) {
            case 'CONNECTION_PREPARED':
                if (value) {
                    if (JSON.stringify(state.ui.console.commands) == JSON.stringify(state.CONSOLE_COMMANDS.EMPTY) || 
                        JSON.stringify(state.ui.console.commands) == JSON.stringify(state.CONSOLE_COMMANDS.SIGNIN)) {
                        state.ui.console.commands = state.CONSOLE_COMMANDS.SIGNIN;
                        defaultState.ui.console.commands = state.CONSOLE_COMMANDS.SIGNIN;
                        stateChange.returns.commands = state.CONSOLE_COMMANDS.SIGNIN;
                    }
                } else {
                    if (JSON.stringify(state.ui.console.commands) == JSON.stringify(state.CONSOLE_COMMANDS.SIGNIN)) {
                        state.ui.console.commands = state.CONSOLE_COMMANDS.EMPTY;
                        defaultState.ui.console.commands = state.CONSOLE_COMMANDS.EMPTY;
                        stateChange.returns.commands = state.CONSOLE_COMMANDS.EMPTY;
                    }
                }
                break;
            case 'ALIGN':
                switch (value) {
                    case 'left':
                        state.ui.css = 'css/left.css';
                        defaultState.ui.css = 'css/left.css';
                        stateChange.returns.css = state.ui.path + 'css/left.css';
                        stateChange.returns.right = false;
                        break;
                    case 'right':
                        state.ui.css = 'css/right.css';
                        defaultState.ui.css = 'css/right.css';
                        stateChange.returns.css = state.ui.path + 'css/right.css';
                        stateChange.returns.right = true;
                        break;
                    default:
                        break;
                }
                break;
            default: 
                break;
        }

        return stateChange;
    },
    /**
     * @param string report 操作名
     * @param array parameters 操作的参数
     */
    call: function(report, parameters) {
              // returns 中包含 parameters 
              var stateChange = {
                  report: report, 
                  returns: parameters
              };

              var returns = stateChange.returns;

              var newState, thread, threadId, content;

              switch (report) {
                  case 'refresh':
                      // follower请求刷新, 返回整个状态对象
                      stateChange = this;
                      break;
                  case 'log':
                      // parameters.message;
                      // parameters.level;
                      // returns message level;
                      
                      var message = parameters.message;
                      var level = parameters.level;
                      
                      state.ui.log.message = message;
                      state.ui.log.level = level;
                      
                      returns.message = message;
                      returns.level = level;

                      break;
                  case 'clearInfo':
                      state.ui.log.message = '';
                      state.ui.log.level = '';
                      break;
                  case 'read':
                      // paramters.threadId
                      // no return;
                      var threadId = parameters.threadId;
                      thread = this._getThread(threadId);
                      thread.ui.unread = '';

                      break;
                  case 'presence':
                      // parameters.from
                      // parameters.show
                      // parameters.status
                      // return 
                      var from = parameters.from;
                      var show = parameters.show;
                      var status = parameters.status;

                      var type = state.PRESENCE_TYPE[show.toUpperCase()]; 
                      var message = status || state.PRESENCE_MESSAGE[type];
                      
                      if (state.user.contacts[from]) {
                          state.user.contacts[from].presence = {};
                          state.user.contacts[from].presence.type = type;
                          state.user.contacts[from].presence.message = message;
                      }

                      var threadOfJid = this._getThreadByJid(from);
                      if (threadOfJid) {
                          threadOfJid.user.presence.type = type;
                          threadOfJid.user.presence.message = message;
                      }

                      returns.jid = from;
                      returns.presence = {};
                      returns.presence.type = type;
                      returns.presence.message = status;

                      break;
                  case 'filter':
                      // parameters.segment
                      // return matchedContacts

                      var segment = parameters.segment.toLowerCase();
                      var matchedContacts = [];
                      var matchedContactsSum = 0;

                      if (segment !== '') {
                          var contacts = [];
                          for (index in state.user.contacts) {
                              contacts.push(state.user.contacts[index]);
                          }

                          // 按在线状态排序
                          contacts.sort(function(a, b) {
                              var presenceA = a.presence.type.toLowerCase();
                              var ra = state.PRESENCE_TYPE_ARRAY.indexOf(presenceA);

                              var presenceB = b.presence.type.toLowerCase();
                              var rb = state.PRESENCE_TYPE_ARRAY.indexOf(presenceB);

                              if (ra < rb) {
                                  return 1;
                              } else {
                                  return -1;
                              }
                          });

                          $.grep(contacts, function(e, i) {
                              var jid = e.jid.toLowerCase();
                              var name = e.name.toLowerCase();

                              var match = jid.indexOf(segment);
                              if (match > -1 && matchedContactsSum++ < 8) {
                                  matchedContacts.unshift(e);
                              } else {
                                  match = name.indexOf(segment);
                                  if (match > -1 && matchedContactsSum++ < 8) {
                                      matchedContacts.unshift(e);
                                  }
                              }
                          });

                      }

                      state.ui.filter.filter = segment;
                      state.ui.filter.scrollTop = 1000;
                      state.ui.filter.matchedContacts = matchedContacts;
                      state.ui.filter.matchedContactsSum = matchedContactsSum;
                      state.ui.filter.invite = state.INVITATION_STATE.NORMAL;

                      returns.matchedContacts = matchedContacts;
                      returns.matchedContactsSum = matchedContactsSum;
                      break;
                  case 'invite':
                      // parameters.jid;
                      // returns.invited;
                      // returns.invalidJid;

                      // TODO jid test 与secretary重复了
                      var jid = parameters.jid || '';
                      var jidReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                      if (jid && jidReg.test(jid) === true) {
                          state.ui.filter.invite = state.INVITATION_STATE.INVITED;
                          returns.invited = true;
                          returns.invalidJid = false;
                      } else {
                          state.ui.filter.invite = state.INVITATION_STATE.INVALID;
                          returns.invited = false;
                          returns.invalidJid = true;
                      }

                      break;
                  case 'acceptInvitation':
                      // parameters.jid
                      // returns.threadId

                      var jid = parameters.jid;

                      // TODO ask secretary?
                      var threadId = $.md5(jid.toLowerCase());

                      var thread = this._getThread(threadId);

                      thread.ui.messagebox.disabled = false;
                      for(index in thread.messages) {
                          if (thread.messages[index].prototype !== 'prototype') {
                              delete thread.messages[index];
                              thread.messages.length--;
                          }
                      }

                      returns.threadId = threadId;
                      break;
                  case 'rejectInvitation':
                      // parameters.jid
                      // returns.threadId

                      var jid = parameters.jid;

                      // TODO ask secretary?
                      var threadId = $.md5(jid.toLowerCase());

                      var thread = this._getThread(threadId);
                      thread.ui.messagebox.disabled = true;
                      for(index in thread.messages) {
                          if (thread.messages[index].prototype !== 'prototype') {
                              delete thread.messages[index];
                              thread.messages.length--;
                          }
                      }

                      returns.threadId = threadId;
                      break;
                  case 'scrollPanel':
                      // parameters.scrollTop;
                      // parameters.threadId;
                      // no returns;

                      var scrollTop = parameters.scrollTop;

                      var thread = this._getThread(parameters.threadId);

                      if (thread) {
                          thread.ui.scrollTop = scrollTop;
                      }

                      break;
                  case 'togglePanel':
                      //parameters.panelId
                      //parameters.expand option true | fale 
                      //return returns.panelState
                      
                      threadId = parameters.panelId;
                      var expand = parameters.expand;
                      thread = this._getThread(threadId);
                      
                      if (typeof(threadId) !== 'undefined' && typeof(thread) != 'undefined') {
                          if (typeof(expand) === 'undefined') {
                              //toggle
                              if (thread.ui.state === state.PANEL_STATE.NORMAL){
                                  newState = state.PANEL_STATE.MINIMIZED;
                              } else {
                                  newState = state.PANEL_STATE.NORMAL;
                              }
                          } else {
                              newState = expand ? state.PANEL_STATE.NORMAL : state.PANEL_STATE.MINIMIZED;
                          }

                          thread.ui.state = newState;

                          returns.newState = thread.ui.state;
                      }

                      break;
                  case 'connecting':
                      // no paramters
                      // returns blocked;
                      state.ui.blocked = true;

                      returns.blocked = true;
                      break;
                  case 'connected':
                      // parameters.jid
                      // parameters.name
                      // parameters.avatar
                      // returns jid
                      // returns commands

                      state.user.signedin = true;
                      state.user.jid = parameters.jid;
                      state.user.name = parameters.name;
                      state.user.avatar = parameters.avatar;

                      state.user.presence.type = state.PRESENCE_TYPE.CHAT;
                      state.user.presence.message = state.PRESENCE_MESSAGE[state.PRESENCE_TYPE.CHAT];

                      state.ui.console.commands = state.CONSOLE_COMMANDS.COMPLETE;

                      state.ui.blocked = false;

                      returns.jid = state.user.jid;
                      returns.presence = state.user.presence;
                      returns.commands = state.ui.console.commands;
                      returns.blocked = false;
                      break;
                  case 'connectError':
                      // no paramters
                      // returns blocked;
                      state.ui.blocked = false;
                      returns.blocked = false;
                      break;
                  case 'signout':
                      // no parameters
                      // return signout true | false
                      
                      delete state.user;
                      delete state.ui;
                      delete state.threads;

                      $.extend(true, state, defaultState);

                      returns.signout = true;
                      returns.defaultState = defaultState;
                      break;
                  case 'changePresence':
                      // parameters.show
                      // parameters.status
                      // retunrs jid
                      // returns presence

                      state.user.presence.type = parameters.show;
                      state.user.presence.message = state.PRESENCE_MESSAGE[parameters.show];

                      returns.jid = state.user.jid;
                      returns.presence = state.user.presence;
                      break;
                  case 'loadUser':
                      // parameters.jid
                      // parameters.name
                      // parameters.avatar
                      // no returns
                      var jid = parameters.jid;

                      if (state.user.contacts[jid].name === jid) {
                          // 如果没有比较好的name，用vcard中的name字段覆盖
                          state.user.contacts[jid].name = parameters.name;
                      }
                      state.user.contacts[jid].avatar = parameters.avatar;

                      break;
                  case 'toggleConsole':
                      // parameters.expand option
                      var expand = parameters.expand;

                      if (typeof(expand) === 'undefined') {
                          //toggle
                          if (state.ui.console.state === ''){
                              newState = state.PANEL_STATE.COLLAPSED;
                          } else {
                              newState = '';
                          }
                      } else {
                          newState = expand ? '' : state.PANEL_STATE.COLLASED;
                      }

                      state.ui.console.state = newState;

                      returns.newState = newState;
                      break;
                  case 'scrolling':
                      // parameters.threadId
                      // parameters.scrollTop
                      threadId = parameters.threadId;
                      thread = this._getThread(threadId);

                      var scrollTop = parameters.scrollTop;

                      if (typeof(threadId) !== 'undefined' && typeof(thread) !== 'undefined') {
                          thread.ui.scrollTop = scrollTop;
                      }

                      // no returns
                      break;
                  case 'typing':
                      //parameters.threadId
                      //parameters.content
                      threadId = parameters.threadId;
                      thread = this._getThread(threadId);
                      
                      content = parameters.content;

                      if (typeof(threadId) != 'undefined' && typeof(thread) != 'undefined') {
                          thread.ui.messagebox.typing = content;
                      }
                      
                      // no returns
                      break;
                  case 'resizeTextarea':
                      //parameters.threadId
                      //parameters.height = 34 //16
                      // no returns
                      threadId = parameters.threadId;
                      thread = this._getThread(threadId);

                      var height = parameters.height;
                      //var width = parameters.width;
                      
                      if (typeof(threadId) != 'undefined' && typeof(thread) != 'undefined') {
                          if (typeof(height) != 'undefined') {
                              thread.ui.messagebox.height = height;
                          } else {
                              thread.ui.messagebox.height = 34; //原始大小
                          }
                      }

                      break;
                  case 'send':
                      //parameters.threadId
                      //paremeters.message
                      threadId = parameters.threadId;
                      var message = parameters.message;
                      
                      thread = this._getThread(threadId);
                      // encode html tag
                      message = $('<div />').text(message).html();

                      if (typeof(threadId) != 'undefined' && typeof(thread) != 'undefined') {
                          //在thread里添加新的message
                          var result = this._insertMessage(thread, {type: state.MESSAGE_TYPE.CHAT_SENT,
                                                from: '',
                                                time: this._now(),
                                                timestamp: this._now(true),
                                                content: message});
                          
                          //清空正在输入的内容
                          thread.ui.messagebox.typing = '';

                          returns.removeOldest = result.removeOldest;
                          returns.message = result.message;
                      }

                      break;
                  case 'recieved':
                      // parameters.from
                      // parameters.threadId
                      // parameters.type
                      // parameters.message
                      // parameters.html = false
                      
                      threadId = parameters.threadId;
                      var from = parameters.from;
                      var type = state.MESSAGE_TYPE[parameters.type.toUpperCase()];
                      var message = parameters.message;
                      if (!parameters.html) {
                          message = $('<div />').text(message).html();
                      }

                      thread = this._getThread(threadId, false);

                      if (thread) {
                          // 存在线程，直接往里插入message
                          var result = this._insertMessage(thread, {type: type,
                                                from: from,
                                                time: this._now(),
                                                timestamp: this._now(true),
                                                content: message});
                          thread.ui.unread = 'unread';

                          stateChange.report = 'recieved';
                          returns.removeOldest = result.removeOldest;
                          returns.message = result.message;
                          returns.unread = 'unread';

                      } else {
                          var collapsedThread = this._getThread(threadId, true);

                          if (collapsedThread) {
                              // 存在collapsed线程
                              this._insertMessage(collapsedThread, {type: type,
                                                        from: from,
                                                        time: this._now(),
                                                        timestamp: this._now(true),
                                                        content: message});

                              var user = {
                                  jid: from,
                                  name: state.user.contacts[from] ? state.user.contacts[from].name : from,
                                  presence: state.user.contacts[from] ? state.user.contacts[from].presence : {type: '', message: ''}
                              };

                          } else {
                              // 还没有线程，新建
                              // copy object
                              var createdThread = $.extend(true, {}, this._getThread('prototype'));

                              var user = {
                                  jid: from,
                                  name: state.user.contacts[from] ? state.user.contacts[from].name : from,
                                  presence: state.user.contacts[from] ? state.user.contacts[from].presence : {type: '', message: ''}
                              };
                              createdThread.id = threadId;
                              createdThread.user = $.extend(true, {}, createdThread.user, user);
                              createdThread.ui.state = state.PANEL_STATE.COLLAPSED;

                              delete createdThread.prototype;

                              state.threads.unshift(createdThread);
                              
                              this._insertMessage(createdThread, {type: type,
                                                        from: from,
                                                        time: this._now(),
                                                        timestamp: this._now(true),
                                                        content: message});
                          }

                          if (state.ui.pendingThreads.indexOf(threadId) === -1) {
                              state.ui.pendingThreads.push(threadId);

                              stateChange.report = 'recievedThread';
                              returns.jid = user.jid;
                              returns.name = user.name;
                              returns.threadId = threadId;
                          }
                      }

                      break;
                  case 'recievedGroupChatInvitation':
                      // parameters.from;
                      // parameters.chatroom;
                      // parameters.reason;
                      //
                      break;
                  case 'acceptThread':
                      // parameters.threadId
                      // returns.createdThread
                      
                      var threadId = parameters.threadId;
                      thread = this._getThread(threadId, true);

                      if (thread) {
                          // move to beginning of threadList
                          this._moveThread(thread, false);
                          thread.ui.state = state.PANEL_STATE.EXPANDED;

                          returns.createdThread = thread;
                      }
                      
                      // remove 
                      var index = state.ui.pendingThreads.indexOf(threadId);
                      state.ui.pendingThreads.splice(index,1);

                      break;
                  case 'toggleFilterPanel':
                      // parameters.expand option
                      var expand = parameters.expand;

                      if (typeof(expand) === 'undefined') {
                          //toggle
                          if (state.ui.filter.state === state.PANEL_STATE.COLLAPSED) {
                              newState = state.PANEL_STATE.EXPANDED;
                          } else {
                              newState = state.PANEL_STATE.COLLAPSED;
                          }
                      } else {
                          newState = expand ? state.PANEL_STATE.EXPANDED : state.PANEL_STATE.COLLAPSED;
                      }

                      state.ui.filter.state = newState;

                      returns.newState = newState;
                      break;
                  case 'createThread':
                      // parameters.jid
                      var jid = parameters.jid;
                      var user = state.user.contacts[jid];

                      // TODO ask secretary?
                      threadId = $.md5(jid.toLowerCase());
                      
                      var existedCollapsedThread = this._getThread(threadId, true);

                      if (existedCollapsedThread) {
                          this._moveThread(existedCollapsedThread, true);
                          existedCollapsedThread.ui.state = state.PANEL_STATE.EXPANDED;

                          returns.createdThread = existedCollapsedThread;
                      } else {
                          // copy object
                          var createdThread = $.extend(true, {}, this._getThread('prototype'));

                          createdThread.id = threadId;
                          createdThread.ui.lastActivity = this._now(true);
                          createdThread.user = $.extend(true, {}, createdThread.user, user);
                          delete createdThread.prototype;

                          state.threads.unshift(createdThread);
                          returns.createdThread = createdThread;
                      }

                      state.ui.filter = {
                          state: state.PANEL_STATE.COLLAPSED,  // 新会话面板状态 collapsed | expand
                          scrollTop: 0, // 滚动位置
                          filter: '',    // 用户filter文本框中的内容
                          matchedContacts: []
                      };
                      returns.filter = state.ui.filter;

                      break;
                  case 'closeThread':
                      // parameters.threadId
                      var threadId = parameters.threadId;

                      var thread = this._getThread(threadId);

                      thread.ui.state = state.PANEL_STATE.COLLAPSED;
                      thread.ui.lastActivity = this._now(true);
                      var moved = this._moveThread(thread, true);
                      break;
                  case 'closeOldestThread':
                      // parameters.num
                      var num = parameters.num;
                      
                      var threadIds = [];
                      for (var i = num; i > 0; i--) {
                          var thread =  this._oldestThread();
                          
                          if (thread) {
                              thread.ui.state = state.PANEL_STATE.COLLAPSED;
                              thread.ui.lastActivity = this._now(true);
                              this._moveThread(thread, true);

                              threadIds.push(thread.id);
                          }
                      }

                      returns.threadIds = threadIds;
                      break;
                  case 'disableThread':
                      // parameters.threadId
                      var threadId = parameters.threadId;
                      var thread = this._getThread(threadId, true);

                      thread.ui.messagebox.disabled = true;

                      stateChange.report = 'disableThread';

                      returns.threadId = threadId;
                      break;
                  case 'loadContacts':
                      // parameters.contacts
                      // return true | false

                      var contacts = parameters.contacts;

                      for (index in contacts) {
                          if (contacts[index].invited) {
                              // invited not response
                              contacts[index].presence = {
                                  type: state.PRESENCE_TYPE.INVITED,
                                  message: state.PRESENCE_MESSAGE[state.PRESENCE_TYPE.INVITED]
                              };
                          } else if (contacts[index].rejected) {
                              // rejected
                              contacts[index].presence = {
                                  type: state.PRESENCE_TYPE.REJECTED,
                                  message: state.PRESENCE_MESSAGE[state.PRESENCE_TYPE.REJECTED]
                              };
                          } else if (typeof(contacts[index].presence) === 'undefined') {
                              contacts[index].presence = {
                                  type: state.PRESENCE_TYPE.UNAVAILABLE,
                                  message: state.PRESENCE_MESSAGE[state.PRESENCE_TYPE.UNAVAILABLE]
                              };
                          }
                      }
                      
                      state.user.contacts = $.extend(state.user.contacts, parameters.contacts);
                      break;
                  default:
                      break;

                }
                return stateChange;
        },
        _now: function(timestamp) {
            var now = new Date();
            if (timestamp) {
                return now.getTime();
            } else {
                return now.toLocaleTimeString();
            }
        },
        _oldestThread: function() {
            var mark = this._now(true);
            var thread = null;
            for (index in state.threads) {
                if (state.threads[index].prototype !== 'prototype' && state.threads[index].ui.state !== state.PANEL_STATE.COLLAPSED) {
                    if (state.threads[index].ui.lastActivity < mark) {
                        mark = state.threads[index].ui.lastActivity;
                        thread = state.threads[index];
                    }
                }
            }

            return thread;
        },
        _trimMessages: function(thread) {
            var messages = thread.messages;
            if (messages.length > state.MAX_MESSAGES) {
                // first is prototype, remove second messages
                messages.splice(1,1);
                return true;
            } else {
                return false;
            }
        },
        _insertMessage: function(thread, message) {
            var longTimePast = message.timestamp - thread.messages[thread.messages.length - 1].timestamp  > 60000; // 1min
            if (thread.messages.length < 2 || longTimePast) {
                message.showTime = true;
            }

            thread.messages.push(message);

            var removeOldest = this._trimMessages(thread);
            thread.ui.lastActivity = this._now(true);

            return {removeOldest: removeOldest, message: message};
        },
        _getThread: function(threadId, includeCollapsed) {
            if (includeCollapsed) {
                var threads = $.grep(state.threads, function(e, i) {
                    return e.ui.state === state.PANEL_STATE.COLLAPSED && e.id === threadId;
                });
            } else {
                var threads = $.grep(state.threads, function(e, i) {
                    return e.ui.state !== state.PANEL_STATE.COLLAPSED && e.id === threadId;
                });
            }

            // 返回唯一的结果
            return threads[0];
        },
        _getThreadByJid: function(jid) {
            var threads = $.grep(state.threads, function(e, i) {
                return e.user.jid === jid;
            });

            // 返回唯一的结果
            return threads[0];
        },
        _moveThread: function(thread, endOrBegin) {
            var index = $.inArray(thread, state.threads);
            if (endOrBegin) {
                // 移动到末尾
                state.threads.splice(index, 1);
                state.threads.unshift(thread);
                return true;
            } else {
                var length = state.threads.length;

                // 移动到头
                state.threads.splice(index, 1);
                state.threads.push(thread);
                return true;
            }
        }
});
