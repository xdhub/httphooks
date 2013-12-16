MultipartParse Reference
========================
**Author:** Elmar Langholz

class MultipartParse
--------------------
**Methods**

MultipartParse.parse(headers, content, cb)
------------------------------------------
Parses a an HTTP response containing a multiple responses through multipart.


**Parameters**

**headers**:  *object*,  The headers of the response.

**content**:  *string*,  The content or body to parse.

**cb**:  *function*,  The node callback to invoke whenever the parsing succeeded or failed.

