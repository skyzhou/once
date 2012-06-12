/**
 * @fileOverview http.js
 */
define(function(require,exports){
	exports.http=function(url){
		return new Request.url(url);
	}
	var Request={
		init:function(){
			this.xhr=window.XMLHttpRequest?new XMLHttpRequest():new ActiveXObject('Microsoft.XMLHTTP');
		},
		url:function(url){
			this.url=url;
			this.method='GET';
			this.param=null;
			this.fns=function(){};
			this.fne=function(){};
			this.init();
			return this;
		},
		method:function(method){
			return this.method=method,this;
		},
		success:function(fn){	
			return this.fns=fn,this;
		},
		error:function(fn){
			return this.fne=fx,this;
		},
		params:function(param){
			return this.param=param,this;
		},
		listen:function(second){
			var that=this, xhr=that.xhr;
			xhr.onreadystatechange=function(){
				xhr.readyState==4&&(xhr.status==200?that.fns(xhr.responseText):that.fne(xhr.status));
			};
			xhr.open(that.method,that.url,true);
			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xhr.send(that.param);
			second&&(that.tm=setTimeout(function(){
				xhr.readyState!=4&&(xhr.abort(),that.fne(xhr.readyState))
			},second))
		}
	};
	Request.url.prototype=Request;
})