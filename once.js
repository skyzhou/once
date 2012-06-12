/**
 * @fileOverview once.js
 * @author sky
 * @version 0.9
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
	
	/**
	 * @description   将相对URL转换成绝对url
	 * @parem {String} id  相对URL
	 * @returns {String} 绝对URL
	 * @example id2src('../../init');
	 */
	function id2src(id){
		var a=document.createElement('a');
		a.href=id;
		return a.protocol+'//'+a.host+a.port+a.pathname+'.js'
	}
	/**
	 * @description 文件加载器
	 * @constructor Loader
	 * @example new Loader();
	 */
	function Loader(){
		this.node=document.createElement('script');
		this.node.type='text/javascript';
		this.node.async=true;
		this.fn=null;
	}
	Loader.script=document.getElementsByTagName('script')[0];
	Loader.prototype={
		request:function(src,fn){
			this.node.src=src;
			console.log(src);
			this.fn=fn;
			//设置回调句柄
			this.onload();
			var script=Loader.script;
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
	
	/**
	 * @description 组管理器，一个JS类文件及其所有require的类作为一个组进行加载监听管理
	 * @constructor Group
	 * @param {String} id 主类名
	 * @example new Group();
	 */
	function Group(id){
		//记录当前队列是否有新的require需要插入 1 有更新  0无更新
		this.state=1;
		//当前队列长度
		this.len=0;
		//主类ID
		this.main=id;
		//插入主类ID并启动
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
		/**
		 * @description 启动类加载
		 */
		run:function(){
			//如果有更新，检索类包管理器中未启动加载的类
			if(this.state){
				var packages=Group.packages;
				for(var p in packages){
					(packages[p].start===0)&&(packages[p].start=1,this.request(p));//启动id
					
				}
				//确定全部启动后，重置状态
				this.state=0;
			}
			
		},
		/**
		 * @description 加载器
		 * @param {String} 类名
		 */
		request:function(id){
			var that=this;
			new Loader().request(id2src(id),function(){
				that.response(id);
			});
		},
		/**
		 * @description 响应器
		 * @param {String} id 当前加载完成的类名
		 */
		response:function(id){
			//由于被加载的JS先执行，然后执行回调函数，可以肯定，最后被插入匿名函数管理器中的匿名函数，即为当前id对应的实现类
			var that=this, fac=Group.anonymous.shift(),packages=Group.packages;
			//队列长度--
			that.len--;
			//检测当前返回的类的依赖关系，把发现的require集合重新插入当前队列中
			Function.isFunction(fac)&&function(){
				//去除注释
				var code=fac.toString().replace(/([^\\]?)((?:\/\*[\s\S]*?\*\/)|(?:\/\/.*))/g,function(a,b,c){
					return (b||'')+'\n';
				});
				var pat=/require\s*\(\s*[\'\"]([^'"]+)[\'\"]\s*\)/g;
				//如果发现新的依赖关系，插入队列
				while(match=pat.exec(code)){	
					match[1]&&that.insert(match[1]);
				}
			}();
			//存储映射
			packages[id].fac=fac;
			//如果长度不为0，一直检测是否有更新，否则停止执行
			that.len?that.run():that.stop();
		},
		stop:function(){
			//当所有依赖关系加载完成后，执行主类
			var main=Group.packages[this.main].fac;
			//将全局变量require作为参数传递给匿名函数
			Function.isFunction(main)&&main(require);
		},
	
		insert:function(id){
			//判断该类是否已经加载或正在加载
			var packages=Group.packages;
			if(!packages[id]){
				packages[id]={start:0,end:0,fac:null,exports:null};
				//长度+1
				this.len++;
				//更新状态
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
	
	/**
	 * @description 全局变量 require,define
	 * @field
	 */
	global.require		=require;
	global.define		=define;
	
	/**
	 * @description 获取script节点含有的'data-main'属性值，作为整个网站运行的入口id
	 */
	(function(){
		var scripts=document.getElementsByTagName('script'),data;
		for(var l=scripts.length,i=l-1;0<=i;i--){
			(data=scripts[i].getAttribute('data-main'))&&main(data);
		}
	})();
})(this);
