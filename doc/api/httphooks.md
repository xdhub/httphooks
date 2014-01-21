HttpHooks Reference
===================
**Author:** Elmar Langholz

HttpHooks(\[options\])
----------------------
Initializes a new instance of the `HttpHooks`.


**Parameters**

**[options]**:  *HttpHooksOptions*,  The `HttpHooks` options to initialize the instance with.

class HttpContext
-----------------
**Members**

**request**:  *object*,  The HTTP request object.

**response**:  *object*,  The HTTP response object

class HttpHooksOptions
----------------------
**Members**

**[hooks]**:  *Hook[]*,  The hooks to initialize the instance with.

**[noMatchHandler]**:  *function*,  The `httpContext` handler for when there is no matching hook or default responder. By default, a 404 response is issued if none is provided.

**[defaultResponder]**:  *function*,  The responder to use when there are no matching responder hooks. By default, null meaning nothing will be executed and instead causing the noMatchHandler to be called.

class HttpHooks
---------------
**Methods**

HttpHooks.addHook(\[hook\])
---------------------------
Adds a `hook` to an existing instance of the `HttpHooks`.


**Parameters**

**[hook]**:  *Hook*,  The hook to add to the instance.

**Returns**

*string[]*,  The collection of added hook identifiers.

HttpHooks.addHooks(hooks)
-------------------------
Adds a collection of `hooks` to an existing instance of the `HttpHooks`.


**Parameters**

**hooks**:  *Hook[]*,  The hooks to add to the instance.

**Returns**

*string[]*,  The collection of added hook identifiers.

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


HttpHooks.get(urlPattern, cb, \[type\])
---------------------------------------
Defines an HTTP GET hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[type]**:  *string*,  The hook type: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`. The default value used when not provided is `'responder'`.

HttpHooks.getListener(urlPattern, cb, \[prefix\])
-------------------------------------------------
Defines a HTTP GET listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[prefix]**:  *string*,  The prefix of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.

HttpHooks.getRequestListener(urlPattern, cb)
--------------------------------------------
Defines a HTTP GET request-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getPreListener(urlPattern, cb)
----------------------------------------
Defines a HTTP GET pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getPostListener(urlPattern, cb)
-----------------------------------------
Defines a HTTP GET post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getResponseListener(urlPattern, cb)
---------------------------------------------
Defines a HTTP GET response-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getResponder(urlPattern, cb, \[prefix\])
--------------------------------------------------
Defines a HTTP GET responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[prefix]**:  *string*,  of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.

HttpHooks.getPreResponder(urlPattern, cb)
-----------------------------------------
Defines a HTTP GET pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.getPostResponder(urlPattern, cb)
------------------------------------------
Defines a HTTP GET post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.put(urlPattern, cb, \[type\])
---------------------------------------
Defines an HTTP PUT hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[type]**:  *string*,  The hook type: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`. The default value used when not provided is `'responder'`.

HttpHooks.putListener(urlPattern, cb, \[prefix\])
-------------------------------------------------
Defines an HTTP PUT listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[prefix]**:  *string*,  of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.

HttpHooks.putRequestListener(urlPattern, cb)
--------------------------------------------
Defines a HTTP PUT request-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putPreListener(urlPattern, cb)
----------------------------------------
Defines an HTTP PUT pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putPostListener(urlPattern, cb)
-----------------------------------------
Defines an HTTP PUT post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putResponseListener(urlPattern, cb)
---------------------------------------------
Defines a HTTP PUT response-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putResponder(urlPattern, cb, \[prefix\])
--------------------------------------------------
Defines an HTTP PUT responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[prefix]**:  *string*,  of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.

HttpHooks.putPreResponder(urlPattern, cb)
-----------------------------------------
Defines an HTTP PUT pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.putPostResponder(urlPattern, cb)
------------------------------------------
Defines an HTTP PUT post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.post(urlPattern, cb, \[type\])
----------------------------------------
Defines an HTTP POST hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[type]**:  *string*,  The hook type: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`. The default value used when not provided is `'responder'`.

HttpHooks.postListener(urlPattern, cb, \[prefix\])
--------------------------------------------------
Defines an HTTP POST listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[prefix]**:  *string*,  of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.

HttpHooks.postRequestListener(urlPattern, cb)
---------------------------------------------
Defines a HTTP POST request-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postPreListener(urlPattern, cb)
-----------------------------------------
Defines an HTTP POST pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postPostListener(urlPattern, cb)
------------------------------------------
Defines an HTTP POST post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postResponseListener(urlPattern, cb)
----------------------------------------------
Defines a HTTP POST response-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postResponder(urlPattern, cb, \[prefix\])
---------------------------------------------------
Defines an HTTP POST responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[prefix]**:  *string*,  of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.

HttpHooks.postPreResponder(urlPattern, cb)
------------------------------------------
Defines an HTTP POST pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.postPostResponder(urlPattern, cb)
-------------------------------------------
Defines an HTTP POST post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.delete(urlPattern, cb, \[type\])
------------------------------------------
Defines an HTTP DELETE hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[type]**:  *string*,  The hook type: `'request-listener' | 'pre-responder' | 'pre-listener' | 'responder' | 'post-listener' | 'post-responder' | 'response-listener'`. The default value used when not provided is `'responder'`.

HttpHooks.deleteListener(urlPattern, cb, \[prefix\])
----------------------------------------------------
Defines an HTTP DELETE listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[prefix]**:  *string*,  of the hook: `'request' | 'pre' | 'post' | 'response'`. The default value used when not provided is `'response'`.

HttpHooks.deleteRequestListener(urlPattern, cb)
-----------------------------------------------
Defines a HTTP DELETE request-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deletePreListener(urlPattern, cb)
-------------------------------------------
Defines an HTTP DELETE pre-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deletePostListener(urlPattern, cb)
--------------------------------------------
Defines an HTTP DELETE post-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deleteResponseListener(urlPattern, cb)
------------------------------------------------
Defines a HTTP DELETE response-listener hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deleteResponder(urlPattern, cb, \[prefix\])
-----------------------------------------------------
Defines an HTTP DELETE responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

**[prefix]**:  *string*,  of the hook: `'pre' | '' | 'post'`. The default value used when not provided is `''`.

HttpHooks.deletePreResponder(urlPattern, cb)
--------------------------------------------
Defines an HTTP DELETE pre-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.deletePostResponder(urlPattern, cb)
---------------------------------------------
Defines an HTTP DELETE post-responder hook whose callback `cb` is invoked upon a request with a url path matching the `urlPattern` is detected.


**Parameters**

**urlPattern**:  *string*,  The url pattern that corresponds to the hook.

**cb**:  *function | HookCallback*,  The callback to invoke whenever there is a matching request.

HttpHooks.noMatchHandler(cb)
----------------------------
Sets the function to invoke whenever there are no hooks that match the request.


**Parameters**

**cb**:  *function*,  The callback to invoke when there is no matching hook.

HttpHooks.dispatch(httpContext)
-------------------------------
Dispatches the `httpContext` to the corresponding matching hooks.


**Parameters**

**httpContext**:  *HttpContext*,  The http context that represents the request.

