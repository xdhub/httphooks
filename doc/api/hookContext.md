HookContext Reference
=====================
**Author:** Elmar Langholz

class Utilities
---------------
**Methods**

Utilities.parseMultiResponse(headers, content, cb)
--------------------------------------------------
Parses a an HTTP response containing a multiple responses through multipart.


**Parameters**

**headers**:  *object*,  The headers of the response.

**content**:  *string*,  The content or body to parse.

**cb**:  *function*,  The node callback to invoke whenever the parsing succeeded or failed.

class HookContext
-----------------
**Members**

**hook**:  *HookInformation*,  The current hook's information.

**request**:  *HookContextRequest*,  The request object.

**[response]**:  *HookContextResponse*,  The response object. *Only provided for any responder or response-listener hook.*

**responseQueue**:  *HookContextResponse[]*,  The previous responses that have been provided by any responder hooks.

**util**:  *Utilities*,  Exposes the available utilities.

**Methods**

HookContext.setResponse(statusCode, headers, content)
-----------------------------------------------------
If the hook is a responder hook, it sets the response for the hook; otherwise,
the function is not provided.


**Parameters**

**statusCode**:  *number*,  The status code to use in the response.

**headers**:  *object*,  The headers to use in the response.

**content**:  *string*,  The content to use in the response.

HookContext.replaceRequest(headers, content)
--------------------------------------------
If the hook is a pre-responder hook, it replaces the incoming request with
the provided argument; otherwise, the function is not provided.


**Parameters**

**headers**:  *object*,  The headers to replace the incoming request with.

**content**:  *string*,  The content to replace the incoming request with.

HookContext.replaceResponse(statusCode, headers, content)
---------------------------------------------------------
If the hook is a post-responder hook, it replaces the outgoing response with
the provided parameters; otherwise, the function is not provided.


**Parameters**

**statusCode**:  *number*,  The status code to replace the outgoing response with.

**headers**:  *object*,  The headers to replace the outgoing response with.

**content**:  *string*,  The content to replace the outgoing response with.

