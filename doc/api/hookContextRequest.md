HookContextRequest Reference
============================
**Author:** Elmar Langholz

class HookContextRequest
------------------------
**Members**

**method**:  *string*,  The HTTP method of the request.

**url**:  *Url*,  The [url](http://nodejs.org/docs/latest/api/url.html) of the request.

**query**:  *object*,  The parsed query string as an object.

**headers**:  *object*,  The parsed headers as an object.

**content**:  *string*,  The request content or body.

**Methods**

HookContextRequest.json()
-------------------------
Converts the provided content or body to a JSON object.


**Returns**

*object*,  The JSON object representing the content.

