/**
 * 服务器中转机制
 * @author 栋寒
 * @email: donghan@taobao.com
 */
var http = require('http'),
	path = require('path'),
	static = require('./static');

var redirectMime = {
	'jpg': 'image/jpg',
	'jpeg': 'image/jpeg',
	'gif': 'image/gif',
	'png': 'image/png',
	'swf': 'application/x-shockwave-flash'
};
var reg = /(jpg)|(jpeg)|(gif)|(png)|(flash)/gi;

//生产环境域名
exports.targetHost = 'assets.taobaocdn.com';
exports.fetch = function(req,res,mime,url){
	//如果是图片或flash，则直接重定向到线上cdn
	if(reg.test(mime)){
		res.writeHead(302,{
			'location': 'http://' + exports.targetHost + url	
		});	
		res.end();
	}

	http.get({
		host: exports.targetHost,
		path: url,
	},function(response){
		var result = ''
		response.on('data',function(data){
			result += data
		}).on('end',function(){
			//如果在生产环境存在此文件
			if(result.indexOf('<h1>404 Not Found</h1>') < 0 ){
				//根据请求头信息，判断是否使用客户端缓存
				if(req.headers['if-modified-since']){
					res.writeHead(304,{
							'content-type': mime,
							'server': 'wd-nodeserver'
					});
					res.end();
				}else{
					//浏览器端cache最长存活时间，单位为秒，这里设置300天
					var maxAge = 300 * 24 * 60 * 60; 
					var curTime = new Date(),
						expiresTime = new Date(curTime.getTime() +  maxAge * 1000);
					expiresTime = expiresTime.toString().replace('+0800 (CST)','').replace(/( )([a-z]{3}) (\d{1,2})/gi,',$3 $2');
					lastmodify = new Date().toString().replace('+0800 (CST)','').replace(/( )([a-z]{3}) (\d{1,2})/gi,',$3 $2');

					res.writeHead(200,{
						'content-type': mime,
						'expires': expiresTime,
						'cache-control': 'max-age=' + maxAge,
						'last-modified': lastmodify,
						'server': 'wd-nodeserver'
					});
					res.end(result);	
				}
			}else{
				//否则404处理
				static.handler404(res);	
			}
		});
		response.setMaxListeners(0);
	});
	
};



