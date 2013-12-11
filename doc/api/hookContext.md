HookContext Reference
=====================
**Author:** Elmar Langholz

class Request
-------------
**Members**

**method**:  *string*,  The HTTP method of the request.

**url**:  *Url*,  The [url](http://nodejs.org/docs/latest/api/url.html) of the request.

**query**:  *object*,  The parsed query string as an object.

**headers**:  *object*,  The parsed headers as an object.

**content**:  *string*,  The request content or body.

**Methods**

Request.json()
--------------
Converts the provided content or body to a JSON object.


**Returns**

*object*,  The JSON object representing the content.

class Response
--------------
**Members**

**statusCode**:  *number*,  The HTTP status code for the response.

**headers**:  *object*,  The response headers as an object.

**content**:  *string*,  The response content or body.

**response**:  *Response[]*,  The previously added responses by other hooks.

**Methods**

Response.isSuccess()
--------------------
Determines whether or not the provided status code is successful.


**Returns**

*boolean*,  True if the status code is successful; otherwise, false.

class HookInformation
---------------------
**Members**

**identifier**:  *string*,  The hook's unique identifier.

**urlPattern**:  *string*,  The url pattern (in the form [route-pattern](https://github.com/bjoerge/route-pattern)) corresponding to the hook.

**order**:  *string*,  The lower-cased hook order corresponding to the hook: `'pre' | 'in' | 'post'`

**type**:  *string*,  The lower-cased hook type corresponding to the hook: `'listener' | 'responder'`

class HookContext
-----------------
**Members**

**request**:  *Request*,  The request object.

**response**:  *Response*,  The response object.

**hook**:  *HookInformation*,  The current hook's information.

**Methods**

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

HookContext.parseMultiResponse(headers, content, cb)
----------------------------------------------------
Parses a an HTTP response containing a multiple responses through multipart.


**Parameters**

**headers**:  *object*,  The headers of the response.

**content**:  *string*,  The content or body to parse.

**cb**:  *function*,  The node callback to invoke whenever the parsing succeeded or failed.

