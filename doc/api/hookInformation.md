HookInformation Reference
=========================
**Author:** Elmar Langholz

class HookInformation
---------------------
**Members**

**identifier**:  *string*,  The hook's unique identifier.

**urlPattern**:  *string*,  The url pattern (in the form [route-pattern](https://github.com/bjoerge/route-pattern)) corresponding to the hook.

**type**:  *string*,  The lower-cased hook type corresponding to the hook: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`

