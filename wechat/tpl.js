'use strict'

var ejs = require('ejs');
var heredoc = require('heredoc');

var tpl = heredoc(function() {/*
	<xml> 
        <ToUserName><![CDATA[<%= toUserName %>]]></ToUserName>
        <FromUserName><![CDATA[<%= fromUserName %>]]></FromUserName>
        <CreateTime><%= createTime %></CreateTime>        
        <MsgType><![CDATA[<%= msgType %>]]></MsgType>
        <% if (msgType==='text') { %>
        	<Content><![CDATA[Hi,my name is hello!]]></Content>
        <% } else if (msgType==='image') { %>
        	<Image>
        		<MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
        	</Image>
        <% } else if (msgType==='voice') { %>
        	<Image>
        		<MsgType><![CDATA[<%= content.media_id %>]]></MsgType>
        	</Image>
        <% } else if (msgType==='video') { %>
        	<Video>
            	<MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
            	<Title><![CDTA[<%= content.title %>]]></Title>
            	<Description><![CDTA[<%= content.description %>]]></Description>
        	</Video>
        <% } else if (msgType==='music') { %>
        	<Music>
            	<Title><![CDTA[<%= content.title %>]]></Title>
            	<Description><![CDTA[<%= content.description %>]]></Description>
            	<MusicUrl><![CDTA[<%= content.musicUrl %>]]></MusicUrl>
            	<HQMusicUrl><![CDTA[<%= content.hqMusicUrl %>]]></HQMusicUrl>
            	<ThumbMediaId><![CDATA[<%= content.thumbMediaId %>]]></ThumbMediaId>
        	</Music>
        <% } else if (msgType==='news') { %>
        	<ArticleCount><%= content.length %></ArticleCount>
		    <Articles>
		    <%  content.forEach(function(item) { %>
		        <item>
		            <Title><![CDATA[<%= item.title %>]]></Title> 
		            <Description><![CDATA[<%= item.description %>]]></Description>
		            <PicUrl><![CDATA[<%= item.picur %>]]></PicUrl>
		            <Url><![CDATA[<%= item.url %>]]></Url>
		        </item>
		        <% }) %>
		    </Articles>
		<% } %>
    </xml>
*/});

var compiled=ejs.compile(tpl);

exports=module.exports={
	compiled:compiled
}
