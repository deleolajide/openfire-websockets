/**
 * follower对象，content script，根据boss的状态借助assistant更新自身显示
 */
 
var follower = (function(){

var _listened = false,
    _port = null,
    $ = null,

/**
 * 初始化follower
 */
init = function(_$) {
    $ = _$;
    if (!_listened) {
        _listened = true;
        _listen();
    }
},

/**
 * 监听boss的指令
 */
_listen = function() {
    chrome.extension.onConnect.addListener(function(port) {
        _port = port;
        _port.onMessage.addListener(follower._callbackUpdate);
    });
},

_sendRequest = function(data, callbackName) {
    if (_port) {
        _port.postMessage({data: data, callback: callbackName}) ;
    }
},

/**
 * 通知boss，有操作。boss会回调
 */
report = function(reportKey, parameters, callback) {
    if (callback) {
        var callbackName = 'gtalklet_callback_' + $.now() + Math.random();
        window[callbackName] = callback;
    }
    if (!parameters) {
        parameters = {};
    }

    _sendRequest({'report' : reportKey, 'parameters': parameters}, callbackName);
},
 
/**
 * 接受boss的状态，回调/重建/调用assistant处理局部刷新
 */
_callbackUpdate = function(data, port) {
    var state = data;
    if (state.callback) {
        // 存在回调时，尝试调用
        var callback = state.callback;
        if (window[callback]) {
            window[callback](state.stateChange);
            delete window[callback];
        }
    } else {
        if (state.enable) {
            // disabled => enabled
            assistant.build(state, true);
            _sendRequest({report: 'showPageAction'});
        } else if (state.disable) {
            // enabled => disabled
            assistant.destroy(true);
            _sendRequest({report: 'showPageAction'});
        } else {
            if ($.isEmptyObject(state.stateChange)) {
                // state中没有stateChange 全部重建显示
                assistant.build(state);
                _sendRequest({report: 'showPageAction'});
            } else {
                // state中有stateChange
                // 局部更新显示
                assistant.handleStateChange(state.stateChange);
            }
        }
    }
};

return {
    init:init,
    report: report,
    _callbackUpdate: _callbackUpdate
};

})();
