/**
 * node服务器
 * @author 栋寒
 * @email: donghan@taobao.com 
 */

/**
 * 导入系统模块
 */
var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	path = require('path');
/**
 * 导入第三方类库和自定义模块
 */
var Iconv = require('iconv').Iconv;
var buffer = require('buffer');
var httpProxy = require('http-proxy'),
	combo = require('./combo'),
	static = require('./static'),
	temp = require('./temp'),
	transfer = require('./transfer');

/**
 * 启动node服务的接口
 * @param port{number} 计算机端口
 * @param host{string} 域名
 * @memberOf server
 * @return void 
 */
exports.run = function(port,host){
	/**
	 * 配置nodejs的对apache反向代理，共用80端口访问
	 * @hostnameOnly 仅仅使用host代理
	 * @bj.ued.taobao.net@router  配置apache的端口和虚拟主机
	 * @a.tbcdn.cn@router  配置a.tbcdn.cn(由nodejs提供的web服务) 端口为8081
	 * 通过以上配置可统一经由80端口访问各自的web服务
	 */
	var options = {
		hostnameOnly: true,
		router: {
			//apache服务
			 'bj.ued.taobao.net': '127.0.0.1:8080',
			 //node服务
			 'assets.daily.taobao.net': '127.0.0.1:8081',
			 'a.tbcdn.cn': '127.0.0.1:8081'
		}
	}
	httpProxy.createServer(options).listen(port);
	http.createServer(function(req,res){
		//获得格式化后的url对象
		var parseUrl = url.parse(req.url);
		var fullpath  = path.join(__dirname,parseUrl.pathname),
			extnames = path.extname(fullpath),
			mime = static.contype[extnames.replace('.','')] || 'text/html;charset=gbk';
		//解决assets.daily.taobao.net的访问
		if(req.headers.host == 'assets.daily.taobao.net'){
			res.writeHead(302,{
				'Location': 'http://a.tbcdn.cn' + req.url
			});	
			res.end();
			return;
		}
		//如果是php文件，重定向到apache环境解析
		if(extnames == '.php'){

			http.get({
				host: 'bj.ued.taobao.net',
				path: '/a.tbcdn.cn' + parseUrl.href
			},function(response){
				var buffers = [], size = 0;
				response.on('data', function(buffer) {
					buffers.push(buffer);
					size += buffer.length;
				});
				response.on('end', function() {
					var buffer = new Buffer(size), pos = 0;
					for(var i = 0, l = buffers.length; i < l; i++) {
						buffers[i].copy(buffer, pos);
						pos += buffers[i].length;
					}
					var gbk_to_utf8_iconv = new Iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');
					var utf8_buffer = gbk_to_utf8_iconv.convert(buffer);
					res.writeHead(200,{
						'content-type': 'text/html;charset=utf-8'	
					})
					res.write(utf8_buffer.toString());
					res.end();
				});
			});
			return;
		}

		//如果是js模板
		if(extnames == '.jst'){	
			temp.action(req,res,fullpath);	
			return;	
		}

		
		//如果是combo链接
		if(parseUrl.search && parseUrl.search.indexOf('??') == 0){
			combo.handlerCombo(parseUrl.pathname,parseUrl.search,req,res);
			return;
		}
		//处理根目录
		if(fullpath == '/home/a.tbcdn.cn/'){
			static.folder(res);	
			return;
		}
		//增加对-min文件的支持
		if(!static.minexp.test(fullpath)){
			fullpath = fullpath.replace(/-min/gi,'');
		}	
		path.exists(fullpath,function(exsits){
			//如果本地存在
			if(exsits){
				//如果是具体文件
				if(extnames.length != 0){
					static.file(req,res,mime,fullpath);	
				}else{
					//否则是文件目录
					static.folder(res);	
				}
			}else{ 
				//如果本地不存在(包括404处理都在此方法中实现)
				transfer.fetch(req,res,mime,parseUrl.pathname);
			}	
		});
	}).listen(8081);	
};
