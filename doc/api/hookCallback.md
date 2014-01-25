HookCallback Reference
======================
**Author:** Elmar Langholz

class HookCallback
------------------
**Members**

**uri**:  *string*,  The uri to the resource containing the function to execute. Supported protocols: `file | http | https | ws`.

**[hookFilter]**:  *string[]*,  For remote hooks (e.g. non-file protocol), the hook types to execute.

**[func]**:  *string*,  If the uri uses the file protocol, the function to execute; otherwise, it is not required.

