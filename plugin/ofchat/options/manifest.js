// SAMPLE MANIFEST
this.manifest = {
    "name": "Gtalklet Options",
    "icon": "icon.png",
    "settings": [
        {
            "tab": "Connection",
            "group": "WebSockets",
            "name": "",
            "type": "description",
            "text": ""
        },
        {
            "tab": "Connection",
            "group": "WebSockets",
            "name": "bosh_service",
            "id": "bosh_service",
            "type": "listBox",
            "label": "",
            "options": [
            ]
        },
        {
            "tab": "Connection",
            "group": "WebSockets",
            "name": "custom_bosh_service",
            "id": "custom_bosh_service",
            "type": "text",
            "label": "",
            "text": "https://localhost:7743/ws/server/",
            "masked": false
        },
        {
            "tab": "Connection",
            "group": "Account",
            "name": "jid",
            "id": "jid",
            "type": "text",
            "text": "admin@localhost",
            "masked": false
        },
        {
            "tab": "Connection",
            "group": "Account",
            "name": "password",
            "id": "password",
            "type": "text",
            "text": "******",
            "masked": true
        },
        {
            "tab": "Connection",
            "group": "Account",
            "name": "auto_sign_in",
            "type": "checkbox",
            "label": "Auto Sign in When Chrome Starts"
        },
		{
            "tab": "Connection",
            "group": "",
            "name": "",
            "type": "description",
            "text": "You must sign out first to modify these fields."
        },
		{
            "tab": "Connection",
            "group": "",
            "name": "signout",
            "id": "signout",
            "type": "button",
            "text": "Sign out"
        },
        {
            "tab": "Advanced",
            "group": "Position",
            "name": "align",
            "type": "radioButtons",
            "options": [
                {
                    "value": "left",
                    "text": "Left"
                },
                {
                    "value": "right",
                    "text": "Right"
                }
            ]
        },
        {
            "tab": "Advanced",
            "group": "Notifications",
            "name": "desktop_notification",
            "type": "checkbox",
            "label": "Desktop Notifications On"
        },
        /*
        {
            "tab": "Advanced",
            "group": "Auto Away",
            "name": "auto_idle",
            "type": "checkbox",
            "label": "Enable Auto Away"
        },
        */
        {
            "tab": "Advanced",
            "group": "Excludes",
            "name": "excludes",
            "type": "textarea"
        },
        {
            "tab": "Advanced",
            "group": "Excludes",
            "name": "",
            "type": "description",
            "text": "e.g. http*://mail.google.com/* <br />\
                     This will disable Gtalklet on Gmail. <br />\
                     Enter one URL per line."
        },
        {
            "tab": "About",
            "group": "Credits",
            "name": "",
            "type": "description",
            "text": "<a href='https://chrome.google.com/extensions/detail/mijcfiakajpjojbebgmoahoddbeafckk' target='_blank'>Gtalklet</a> Copyright © 2011, <br />\
                    Sean Zheng <a href='mailto:zealotrunner@gmail.com'>zealotrunner@gmail.com</a><br />\
                    Ambar Lee <a href='mailto:ambar.lee@gmail.com'>ambar.lee@gmail.com</a><br />\
                     <a href='http://jquery.com/' target='_blank'>jQuery</a> [Licensed under MIT]<br />\
                     <a href='http://strophe.im/' target='_blank'>strophejs</a> [Licensed under MIT]<br />\
                     <a href='https://github.com/frankkohlhepp/fancy-settings' target='_blank'>Fancy Settings</a> [Frank Kohlhepp - Licensed under the LGPL 2.1]<br />\
                     <a href='http://ejohn.org/blog/javascript-micro-templating/' target='_blank'>Simple JavaScript Templating</a> [John Resig - Licensed under MIT]<br />\
                     <a href='https://github.com/frankkohlhepp/fancy-settings' target='_blank'>jQuery blockUI plugin</a> [M. Alsup - Licensed under MIT]<br />\
                     <a href='https://gist.github.com/796851' target='_blank'>jQuery Scrollbar Width</a> [Rasmus Schultz - Licensed under LGPL v3.0]<br />\
                     <br />\
                     <a href='http://gentleface.com/free_icon_set.html' target='_blank'>Free Mono Icon Set</a> [Licensed under Creative Commons Attribution-Noncommercial Works 3.0 Unported]\
                     <br />\
                     <br />"
        },
        {
            "tab": "About",
            "group": "",
            "name": "",
            "type": "description",
            "text": "OfChat is a Google chrome extension for Openfire WebSocket. It is based on Gtalklet"
                    /*
                     Licensed under <a href='http://www.opensource.org/licenses/mit-license.php' target='_blank'>MIT</a><br />\
                     <a href='https://github.com/zealotrunner/gtalklet' target='_blank'>Source</a> | \
                     <a href='https://chrome.google.com/extensions/detail/mijcfiakajpjojbebgmoahoddbeafckk' target='_blank'>Chrome Extension</a><br />\
                     "
                     */
        }
    ]
};
