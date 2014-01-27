RemoteHook Reference
====================
**Author:** Elmar Langholz

RemoteHook(opts)
----------------
Initializes a new instance of the `RemoteHook`.


**Parameters**

**opts**:  *RemoteHookOptions*,  The options to initialize the remote hook instance with.

class RemoteHookOptions
-----------------------
**Members**

**uri**:  *[URL](http://nodejs.org/api/url.html)*,  The uri to the resource containing the function(s) to execute. Supported protocols: `file | http | https | ws`.

**hookType**:  *string*,  The hook type.

**[hookFilter]**:  *string[]*,  For remote hooks (e.g. non-`file` protocol), the hook types to execute.

**[socketFramework]**:  *string*,  If the uri uses the `ws` protocol, the socket service to use: `sockjs | socket.io`; otherwise, it is not required.

class RemoteHook
----------------
