HookContextResponse Reference
=============================
**Author:** Elmar Langholz

class HookContextResponse
-------------------------
**Members**

**statusCode**:  *number*,  The HTTP status code for the response.

**headers**:  *object*,  The response headers as an object.

**content**:  *string*,  The response content or body.

**Methods**

HookContextResponse.isSuccess()
-------------------------------
Determines whether or not the provided status code is successful.


**Returns**

*boolean*,  True if the status code is successful; otherwise, false.

