// ECMAScript 5 strict mode
"use strict";
assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");
/////////////////////////////////////
// Plugin class
// *** CHANGE THE PLUGIN ID HERE *** - must match the "id" property in edittime.js
//          vvvvvvvv
cr.plugins_.OpenMMO = function(runtime) {
    this.runtime = runtime;
};
(function() {
    /////////////////////////////////////
    // *** CHANGE THE PLUGIN ID HERE *** - must match the "id" property in edittime.js
    //                            vvvvvvvv
    var pluginProto = cr.plugins_.OpenMMO.prototype;
    /////////////////////////////////////
    // Object type class
    pluginProto.Type = function(plugin) {
        this.plugin = plugin;
        this.runtime = plugin.runtime;
    };
    var typeProto = pluginProto.Type.prototype;
    // called on startup for each object type
    typeProto.onCreate = function() {};
    /////////////////////////////////////
    // Instance class
    pluginProto.Instance = function(type) {
        this.type = type;
        this.runtime = type.runtime;
        this.socket = null;
        this.socketsOnline = 0;
        this.lastConId = "default";
        this.lastDconId = "default";
        this.movInfo = {};
        this.players = [];
        // any other properties you need, e.g...
        // this.myValue = 0;
    };
    var instanceProto = pluginProto.Instance.prototype;
    // called whenever an instance is created
    instanceProto.onCreate = function() {
        // note the object is sealed after this call; ensure any properties you'll ever need are set on the object
        // e.g...
        // this.myValue = 0;
    };
    // called whenever an instance is destroyed
    // note the runtime may keep the object after this call for recycling; be sure
    // to release/recycle/reset any references to other objects in this function.
    instanceProto.onDestroy = function() {};
    // called when saving the full state of the game
    instanceProto.saveToJSON = function() {
        // return a Javascript object containing information about your object's state
        // note you MUST use double-quote syntax (e.g. "property": value) to prevent
        // Closure Compiler renaming and breaking the save format
        return {
            // e.g.
            //"myValue": this.myValue
        };
    };
    // called when loading the full state of the game
    instanceProto.loadFromJSON = function(o) {
        // load from the state previously saved by saveToJSON
        // 'o' provides the same object that you saved, e.g.
        // this.myValue = o["myValue"];
        // note you MUST use double-quote syntax (e.g. o["property"]) to prevent
        // Closure Compiler renaming and breaking the save format
    };
    // only called if a layout object - draw to a canvas 2D context
    instanceProto.draw = function(ctx) {};
    // only called if a layout object in WebGL mode - draw to the WebGL context
    // 'glw' is not a WebGL context, it's a wrapper - you can find its methods in GLWrap.js in the install
    // directory or just copy what other plugins do.
    instanceProto.drawGL = function(glw) {};
    // The comments around these functions ensure they are removed when exporting, since the
    // debugger code is no longer relevant after publishing.
    /**BEGIN-PREVIEWONLY**/
    instanceProto.getDebuggerValues = function(propsections) {
        // Append to propsections any debugger sections you want to appear.
        // Each section is an object with two members: "title" and "properties".
        // "properties" is an array of individual debugger properties to display
        // with their name and value, and some other optional settings.
        propsections.push({
            "title": "My debugger section",
            "properties": [
                // Each property entry can use the following values:
                // "name" (required): name of the property (must be unique within this section)
                // "value" (required): a boolean, number or string for the value
                // "html" (optional, default false): set to true to interpret the name and value
                //                                   as HTML strings rather than simple plain text
                // "readonly" (optional, default false): set to true to disable editing the property
                // Example:
                // {"name": "My property", "value": this.myValue}
            ]
        });
    };
    instanceProto.onDebugValueEdited = function(header, name, value) {
        // Called when a non-readonly property has been edited in the debugger. Usually you only
        // will need 'name' (the property name) and 'value', but you can also use 'header' (the
        // header title for the section) to distinguish properties with the same name.
        if (name === "My property") this.myProperty = value;
    };
    /**END-PREVIEWONLY**/
    //////////////////////////////////////
    // Conditions
    function Cnds() {};
    // the example condition
    Cnds.prototype.OnConnect = function() {
        return true;
    };
    Cnds.prototype.OnConnection = function() {
        return true;
    };
    Cnds.prototype.OnDisconnection = function() {
        return true;
    };
    Cnds.prototype.LoadAll = function() {
        return true;
    }; 
    Cnds.prototype.OnMovement = function() {
        return true;
    };
    // ... other conditions here ...
    pluginProto.cnds = new Cnds();
    //////////////////////////////////////
    // Actions
    function Acts() {};
    // the example action
    Acts.prototype.connect = function(ip, port) {
        this.socket = window.io.connect('http://' + ip + ':' + port, {
            'force new connection': true
        });
        var instance = this;
        var runtime = instance.runtime;
        this.socket.on('connected', function(data) {
            instance.socketsOnline = data.socketsNum.length;
            instance.lastConId = data.id;
            instance.players = data.socketsNum;
            runtime.trigger(pluginProto.cnds.OnConnect, instance);
            runtime.trigger(pluginProto.cnds.LoadAll, instance);
        });
        this.socket.on('connection', function(data) {
            instance.socketsOnline = data.socketsNum.length;
            instance.lastConId = data.id;
            runtime.trigger(pluginProto.cnds.OnConnection, instance);
        });
        this.socket.on('playerLeft', function(data) {
            instance.socketsOnline = data.socketsNum.length;
            instance.lastDconId = data.id;
            runtime.trigger(pluginProto.cnds.OnDisconnection, instance);
        });
        this.socket.on('movement', function(data) {
            console.log(data);
            instance.movInfo.posX = data.posX;
            instance.movInfo.posY = data.posY;
            instance.movInfo.id = data.id;
            runtime.trigger(pluginProto.cnds.OnMovement, instance);
        });
    };
    Acts.prototype.emit = function(event, data) {
        this.socket.emit(event, JSON.parse(data));
    };
    // ... other actions here ...
    pluginProto.acts = new Acts();
    //////////////////////////////////////
    // Expressions
    function Exps() {};
    // the example expression
    Exps.prototype.SocketsOnline = function(ret) // 'ret' must always be the first parameter - always return the expression's result through it!
        {
            ret.set_int(this.socketsOnline); // return our value
            // ret.set_float(0.5);          // for returning floats
            // ret.set_string("Hello");     // for ef_return_string
            // ret.set_any("woo");          // for ef_return_any, accepts either a number or string
        };
    Exps.prototype.LastConId = function(ret) // 'ret' must always be the first parameter - always return the expression's result through it!
        {
            // return our value
            // ret.set_float(0.5);          // for returning floats
            ret.set_string(this.lastConId); // for ef_return_string
            // ret.set_any("woo");          // for ef_return_any, accepts either a number or string
        }; 
   Exps.prototype.LastDconId = function(ret) // 'ret' must always be the first parameter - always return the expression's result through it!
        {
            // return our value
            // ret.set_float(0.5);          // for returning floats
            ret.set_string(this.lastDconId); // for ef_return_string
            // ret.set_any("woo");          // for ef_return_any, accepts either a number or string
        };
    Exps.prototype.PlayerList = function(ret) // 'ret' must always be the first parameter - always return the expression's result through it!
        {
            // return our value
            // ret.set_float(0.5);          // for returning floats
            var o = {};
            for (var i = this.players.length - 1; i >= 0; i--) {
                Object.defineProperty(o, this.players[i], {
                    value: true,
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
            }
            ret.set_string(JSON.stringify({
                "c2dictionary": true,
                "data": o
            })); // for ef_return_string
            // ret.set_any("woo");          // for ef_return_any, accepts either a number or string
        };
    Exps.prototype.PeerPosX = function(ret) // 'ret' must always be the first parameter - always return the expression's result through it!
        {
            console.log(this.movInfo.posX);
            ret.set_float(this.movInfo.posX);
        };
    Exps.prototype.PeerPosY = function(ret) // 'ret' must always be the first parameter - always return the expression's result through it!
        {
            console.log(this.movInfo.posY);
            ret.set_float(this.movInfo.posY);
        };
    Exps.prototype.PeerId = function(ret) // 'ret' must always be the first parameter - always return the expression's result through it!
        {

            ret.set_string(this.movInfo.id);
        };
    // ... other expressions here ...
    pluginProto.exps = new Exps();
}());