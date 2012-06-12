/**
 * @author sky
 */
;(function(){
	var toString=Object.prototype.toString
	var AP=Array.prototype;
	
	Function.isFunction=function(val){
		return toString.call(val)==='[object Function]';
	};
	Array.isArray=Array.isArray||function(val){
		return toString.call(val)==='[object Array]';
	};
	AP.forEach=AP.forEach||function(fn){
		for(var i=0,l=this.length;i<l;i++){
			fn(this[i],i,this);
		}
	};
})();
;(function(global){	
	var script=function(){
		var scripts=document.getElementsByTagName('script');
		for(var i=0,l=scripts.length;i<l;i++){
			if(scripts[i].getAttribute('data-main')){
				return scripts[i];
			}
		}
	}();
	function id2src(id){
		var src,base=Loader.base;
		if(/\w+:\/\//.test(id)){
			src=id;
		}
		else if(base){
			var a=base.split('/'),b=id.split('/');
			while(b[0]==='..'&&a.length>1){
				a.pop();
				b.shift();
			}
			b[0]==='.'&&b.shift();
			src=a.concat(b).join('/');
		}
		else{
			src=id.replace('./','');
		}
		return src+'.js';
	}
	function Loader(){
		this.node=document.createElement('script');
		this.node.type='text/javascript';
		this.fn=null;
	}
	Loader.base=function(){
		var base=script.src.replace(/\/?[\w]+\.js.*/,'');
		return base;
	}();
	Loader.prototype={
		request:function(src,fn){
			this.node.src=src;
			this.fn=fn;
			this.onload();
			script.parentNode.insertBefore(this.node,script);
		},
		onload:function(){
			var node=this.node,that=this;
			node.onload=node.onerror=node.onreadystatechange=function(){
				/loaded|complete|undefined/.test(node.readyState)&&function(){
					node.onload=node.onerror=node.onreadystatechange=null;
					node.parentNode.removeChild(node);
					node=undefined;
					that.fn();
				}();
			}
		}
		
	}
	
	//组管理器
	function Group(id){
		this.state=1;//1 有更新  0无更新
		this.len=0;
		this.main=id;
		this.insert(id).run();
	}
	//类包管理器
	Group.packages	={};
	//匿名函数管理器
	Group.anonymous	=[];
	//接口获取
	Group.select	=function(id){
		var packages=Group.packages;
		//if(!packages[id].exports){ //注释掉这个判断，防止引用变量被另外的地方修改，发生奇怪的错误
			var exports={},ret,fac=packages[id].fac;
			ret=Function.isFunction(fac)?fac(require,exports):fac;
			packages[id].exports=ret||exports;
		//}
		return packages[id].exports
	};
	Group.prototype	={
		run:function(restart){
			//如果有更新
			if(this.state){
				var packages=Group.packages;
				for(var p in packages){
					(packages[p].start===0)&&(packages[p].start=1,this.request(p));//启动id
					
				}
				this.state=0;
			}
			
		},
		request:function(id){
			var that=this;
			new Loader().request(id2src(id),function(){
				that.response(id);
			});
		},
		response:function(id){
			var that=this, fac=Group.anonymous.shift(),packages=Group.packages;;
			that.len--;
			Function.isFunction(fac)&&function(){
				var code=fac.toString().replace(/([^\\]?)((?:\/\*[\s\S]*?\*\/)|(?:\/\/.*))/g,function(a,b,c){
					return (b||'')+'\n';
				});
				var pat=/require\s*\(\s*[\'\"]([^'"]+)[\'\"]\s*\)/g;
				
				while(match=pat.exec(code)){	
					match[1]&&that.insert(match[1]);
				}
			}();
			packages[id].fac=fac;
			//如果长度不为0，一直检测是否有更新，否则停止执行
			that.len?that.run():that.stop();
		},
		stop:function(){
			//执行main
			var main=Group.packages[this.main].fac;
			Function.isFunction(main)&&main(require);
		},
	
		insert:function(id){
			//如果类未加载或未正在加载
			var packages=Group.packages;
			if(!packages[id]){
				packages[id]={start:0,end:0,fac:null,exports:null};
				this.len++;
				this.state=1;
			}
			return this;
		}
	};
	
	function main(id){
		id&&(new Group(id));
	}
	function require(id){	
		return Group.select(id);
	}
	function define(fac){
		Group.anonymous.push(fac);
	}
	
	//全局变量
	global.require		=require;
	global.define		=define;
	
	//data-main
	main(script.getAttribute('data-main'));
})(this);
