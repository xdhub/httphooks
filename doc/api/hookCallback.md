HookCallback Reference
======================
**Author:** Elmar Langholz

class HookCallback
------------------
**Members**

**uri**:  *string*,  The uri to the resource containing the function to execute. Supported protocols: `file | http | https | ws`.

**[hookFilter]**:  *string[]*,  For remote hooks (e.g. non-`file` protocol), the hook types to execute. By default, if not defined, we execute all and any corresponding. Hook types: `request-listener | pre-responder | pre-listener | responder | post-listener | post-responder | response-listener`.

**[func]**:  *string*,  If the uri uses the `file` protocol, the function to execute; otherwise, it is not required.

**[socketFramework]**:  *string*,  If the uri uses the `ws` protocol, the socket service to use: `sockjs | socket.io`; otherwise, it is not required.

