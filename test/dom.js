/**
 * @fileOverview dom.js
 */
define(function(require,exports){
	var $=exports.$=function(arg){
		return new dom.init(arg);
	};
	var doc=document;
	dom={
		init:function(arg){
			return this[0]=arg.nodeType?arg:doc.getElementById(arg),this;
		},
		html:function(){
			var html=arguments[0];
			return arguments.length?(this[0].innerHTML=html,this):this[0].innerHTML;
		},
		show:function(){
			return this.css('display',''),this;
		},
		hide:function(){
			return this.css('display','none'),this;
		},
		attr:function(){
			var name=arguments[0],value=arguments[1];
			return arguments.length==1?this[0].getAttribute(name):(this[0].setAttribute(name.value),this);
		},
		css:function(){
			var name=arguments[0],value=arguments[1];
			return arguments.length==1?this[0].style[name]:(this[0].style[name]=value,this);
		},
		parent:function(){
			return $(this[0].parentNode);
		}
		
	};
	dom.init.prototype=dom;
});