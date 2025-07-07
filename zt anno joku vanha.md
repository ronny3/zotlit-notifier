---
callout: false
---
<% if (it.imgEmbed) { %><% /*if on KUVA*/ %>
<% if (it.commentMd) { %><% /*if kuva+kommentti on*/ %>
- - -
![<%= it.blockID  %>](file:///<%= it.imgPath %>)<% /*tämä rivi käsittelee kuvan*/ %>
<%= it.commentMd %>: [p. <%= it.pageLabel %>](zotero://open-pdf/library/items/<%= it.parentItem %>?page=<%= it.pageLabel %>&annotation=<%= it.key %>)
<% } else if (it.text) { %><% /*if kuva+teksti on*/ %>
- - -
![<%= it.blockID  %>](file:///<%= it.imgPath %>)<% /*tämä rivi käsittelee kuvan*/ %>
- ==<%= it.text %>== [p. <%= it.pageLabel %>](zotero://open-pdf/library/items/<%= it.parentItem %>?page=<%= it.pageLabel %>&annotation=<%= it.key %>)
<% } else if (it.commentMd == "") { %><% /*if only image no text*/ %>
- - -
![<%= it.blockID  %>](file:///<%= it.imgPath %>)<% /*tämä rivi käsittelee kuvan*/ %>
<% } else {%> ?? error parsessa 1 <% /*else error*/ %>
<% }  %>
<% } else { %><% /*if ei KUVAA*/ %>
<% if (it.comment) { %><% /*if kommentti on*/ %><% /*NORMAALI TAPAUS*/ %>
<%= it.comment %>:
- ==<%= it.text %>== [p. <%= it.pageLabel %>](zotero://open-pdf/library/items/<%= it.parentItem %>?page=<%= it.pageLabel %>&annotation=<%= it.key %>) [@<%= it.docItem.citekey %>]
<% } else if (it.text) { %><% /*if teksti on*/ %>
- ==<%= it.text %>== [p. <%= it.pageLabel %>](zotero://open-pdf/library/items/<%= it.parentItem %>?page=<%= it.pageLabel %>&annotation=<%= it.key %>) [@<%= it.docItem.citekey %>]
<% } else { %> ?? error parsessa 2 ?? <% /*else error*/ %>
<% }  %>
<% }  %><% /*if kuva on päättyy tähän*/ %>
