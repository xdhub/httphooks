HttpHooks API Reference
=======================
**Author:** Elmar Langholz

HttpHooks(\[hooks\])
--------------------
Initializes a new instance of the `HttpHooks`.


**Parameters**

**[hooks]**:  *Hook[]*,  The hooks to initialize the instance with.

class HttpContext
-----------------
**Members**

**request**:  *object*,  The HTTP request object.

**response**:  *object*,  The HTTP response object

class HookCallback
------------------
**Members**

**path**:  *string*,  The path to the node file containing the function to execute.

**func**:  *string*,  The function to execute.

class Hook
----------
**Members**

**method**:  *string*,  The lower-cased HTTP method corresponding to the hook: `'get' | 'put' | 'post' | 'delete'`

**urlPattern**:  *string*,  The url pattern (in the form [route-pattern](https://github.com/bjoerge/route-pattern)) corresponding to the hook.

**order**:  *string*,  The lower-cased hook order corresponding to the hook: `'pre' | 'in' | 'post'`

**type**:  *string*,  The lower-cased hook type corresponding to the hook: `'listener' | 'responder'`

**callback**:  *function|HookCallback*,  The hook callback to invoke in the specified order when a matching request is determined.

class HttpHooks
---------------
**Methods**

HttpHooks.addHook(\[hook\])
---------------------------
Adds a `hook` to an existing instance of the `HttpHooks`.


**Parameters**

**[hook]**:  *Hook*,  The hook to add to the instance.

**Returns**

*string[]*,  The collection of added in-order hook identifiers.

HttpHooks.addHooks(hooks)
-------------------------
Adds a collection of `hooks` to an existing instance of the `HttpHooks`.


**Parameters**

**hooks**:  *Hook[]*,  The hooks to add to the instance.

**Returns**

*string[]*,  The collection of added in-order hook identifiers.

HttpHooks.removeHooks(identifiers)
----------------------------------
Removes a collection of hook given its corresponding `identifiers` from an existing instance of the `HttpHooks`.


**Parameters**

**identifiers**:  *string[]*,  The unique identifiers corresponding to the hooks to remove from the instance.

HttpHooks.removeHook(identifier)
--------------------------------
Removes a hook given its corresponding `identifier` from an existing instance of the `HttpHooks`.


**Parameters**

**identifier**:  *string*,  The unique identifier corresponding to the hook to remove from the instance.

HttpHooks.clear()
-----------------
Clears all and any existing hooks previously defined on an existing instance of the `HttpHooks`.


HttpHooks.get(urlPattern, cb, \[order\], \[type\])
--------------------------------------------------
Defines an HTTP GET hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  The hook order: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

**[type]**:  *string*,  The hook type: `'listener' | 'responder'`. The default value used when not provided is `'responder'`.

HttpHooks.getListener(urlPattern, cb, \[order\])
------------------------------------------------
Defines a HTTP GET listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

HttpHooks.getPreListener(urlPattern, cb)
----------------------------------------
Defines a HTTP GET pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getInListener(urlPattern, cb)
---------------------------------------
Defines a HTTP GET in-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getPostListener(urlPattern, cb)
-----------------------------------------
Defines a HTTP GET post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getResponder(urlPattern, cb, \[order\])
-------------------------------------------------
Defines a HTTP GET responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

HttpHooks.getPreResponder(urlPattern, cb)
-----------------------------------------
Defines a HTTP GET pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getInResponder(urlPattern, cb)
----------------------------------------
Defines a HTTP GET in-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getPostResponder(urlPattern, cb)
------------------------------------------
Defines a HTTP GET post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.put(urlPattern, cb, \[order\], \[type\])
--------------------------------------------------
Defines an HTTP PUT hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

**[type]**:  *string*,  of the hook: `'listener' | 'responder'`. The default value used when not provided is `'responder'`.

HttpHooks.putListener(urlPattern, cb, \[order\])
------------------------------------------------
Defines an HTTP PUT listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

HttpHooks.putPreListener(urlPattern, cb)
----------------------------------------
Defines an HTTP PUT pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putInListener(urlPattern, cb)
---------------------------------------
Defines an HTTP PUT in-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putPostListener(urlPattern, cb)
-----------------------------------------
Defines an HTTP PUT post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putResponder(urlPattern, cb, \[order\])
-------------------------------------------------
Defines an HTTP PUT responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

HttpHooks.putPreResponder(urlPattern, cb)
-----------------------------------------
Defines an HTTP PUT pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putInResponder(urlPattern, cb)
----------------------------------------
Defines an HTTP PUT in-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putPostResponder(urlPattern, cb)
------------------------------------------
Defines an HTTP PUT post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.post(urlPattern, cb, \[order\], \[type\])
---------------------------------------------------
Defines an HTTP POST hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

**[type]**:  *string*,  of the hook: `'listener' | 'responder'`. The default value used when not provided is `'responder'`.

HttpHooks.postListener(urlPattern, cb, \[order\])
-------------------------------------------------
Defines an HTTP POST listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

HttpHooks.postPreListener(urlPattern, cb)
-----------------------------------------
Defines an HTTP POST pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postInListener(urlPattern, cb)
----------------------------------------
Defines an HTTP POST in-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postPostListener(urlPattern, cb)
------------------------------------------
Defines an HTTP POST post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postResponder(urlPattern, cb, \[order\])
--------------------------------------------------
Defines an HTTP POST responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

HttpHooks.postPreResponder(urlPattern, cb)
------------------------------------------
Defines an HTTP POST pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postInResponder(urlPattern, cb)
-----------------------------------------
Defines an HTTP POST in-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postPostResponder(urlPattern, cb)
-------------------------------------------
Defines an HTTP POST post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.delete(urlPattern, cb, \[order\], \[type\])
-----------------------------------------------------
Defines an HTTP DELETE hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

**[type]**:  *string*,  of the hook: `'listener' | 'responder'`. The default value used when not provided is `'responder'`.

HttpHooks.deleteListener(urlPattern, cb, \[order\])
---------------------------------------------------
Defines an HTTP DELETE listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

HttpHooks.deletePreListener(urlPattern, cb)
-------------------------------------------
Defines an HTTP DELETE pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deleteInListener(urlPattern, cb)
------------------------------------------
Defines an HTTP DELETE in-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deletePostListener(urlPattern, cb)
--------------------------------------------
Defines an HTTP DELETE post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deleteResponder(urlPattern, cb, \[order\])
----------------------------------------------------
Defines an HTTP DELETE responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[order]**:  *string*,  of the hook: `'pre' | 'in' | 'post'`. The default value used when not provided is `'in'`.

HttpHooks.deletePreResponder(urlPattern, cb)
--------------------------------------------
Defines an HTTP DELETE pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deleteInResponder(urlPattern, cb)
-------------------------------------------
Defines an HTTP DELETE in-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deletePostResponder(urlPattern, cb)
---------------------------------------------
Defines an HTTP DELETE post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.onNoMatch(callback)
-----------------------------
The `callback` function to invoke whenever there is no hooks that matches the request.


**Parameters**

**callback**:  *function*,  The callback to invoke when there is no matching hook.

HttpHooks.dispatch(httpContext)
-------------------------------
Dispatches the `httpContext` to the corresponding matching hooks.


**Parameters**

**httpContext**:  *HttpContext*,  The http context that represents the request.

