Hook Reference
==============
**Author:** Elmar Langholz

class Hook
----------
**Members**

**method**:  *string*,  The lower-cased HTTP method corresponding to the hook: `'get' | 'put' | 'post' | 'delete'`

**urlPattern**:  *string*,  The url pattern (in the form [route-pattern](https://github.com/bjoerge/route-pattern)) corresponding to the hook.

**type**:  *string*,  The lower-cased type corresponding to the hook: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`

**callback**:  *function | HookCallback*,  The hook callback to invoke in the specified order when a matching request is determined.

