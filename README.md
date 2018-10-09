node-red-contrib-socrata
------------------------

[Node-RED](http://nodered.org) node to connect to Socrata Open Data API endpoints.


Install
-------

    npm install node-red-contrib-socrata

Usage
-----
Refer to the `Info` tab of the node for full details.

The node itself provides a more convenient access to the SoQL queries to your Socrata endpoint. Depending on your usage scenario additional logic/flow control nodes will be needed up/downstream to manage queries and the resulting data.

Nodes such as [`node-red-contrib-splitter`](https://flows.nodered.org/node/node-red-contrib-splitter) will come in especially handy to process the potentially large dataset from a Socrata query.


Basic Examples
--------------
_todo_: basic examples datasets

_todo_: examples for dealing with larger datasets


FAQ
---
1. Do I need to have an app token?

> You'll need to sign up for a Socrata developer account via your open data provider to generate an app token. The app token gives you unthrottled access to the data endpoint (but as the [Socrata Developers Portal](https://dev.socrata.com/docs/app-tokens.html) says, don't be a jerk).

2. Why do requests take such a long time?

> The underlying HTTP/S request is asynchronous, and shouldn't lock up the rest of Node-RED. As with any SQL-like query, it is up to you to write efficient queries to get the data you need. Use the `$limit` and `$offset` parameters, along with control logic before the Socrata node, to [manage large dataset queries](https://dev.socrata.com/docs/paging.html).


Further Resources
-----------------

[SODA Developers Portal](https://dev.socrata.com/docs/paging.html)



Credits
-------

Copyright (c) 2018 [Chuan Khoo](https://www.chuank.com)

Please refer to [LICENSE](LICENSE) for open-source licensing details & attribution.
