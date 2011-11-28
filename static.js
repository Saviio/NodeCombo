var fs = require('fs');

//声明-min文件的预留类型
exports.minexp = /(editor-min|editor-core-pkg-min|calendar-pkg-min|editor-pkg-min|editor-plugin-pkg-min|kissy-min|simplecalendar-min|sizzle-pkg-min|base-pkg-min|jstorage-pkg-min)/gi;
//声明可能出现的文件类型
exports.contype = {
	'html' : 'text/html;charset=gbk',
	'js': 'application/x-javascript',
	'css': 'text/css',
	'jpg': 'image/jpg',
	'jpeg': 'image/jpeg',
	'gif': 'image/gif',
	'png': 'image/png',
	'swf': 'application/x-shockwave-flash'
};
/**
 * 静态文件处理
 * 
 */
exports.file = function(req,res,mime,fullpath){
	//根据请求头信息，判断是否使用客户端缓存
	if(req.headers['if-modified-since']){
		res.writeHead(304,{
				'content-type': mime,
				'server': 'wd-nodeserver'
		});
		res.end();
	}else{
		if(mime == 'text/html;charset=gbk'){
			res.writeHead(200,{
				'content-type': mime,
				'server': 'wd-nodeserver'
			});		
		}else{
			//浏览器端cache最长存活时间，单位为秒，这里设置300天
			var maxAge = 300 * 24 * 60 * 60; 
			var curTime = new Date(),
				expiresTime = new Date(curTime.getTime() +  maxAge * 1000);
			expiresTime = expiresTime.toString().replace('+0800 (CST)','').replace(/( )([a-z]{3}) (\d{1,2})/gi,',$3 $2');
			lastmodify = fs.statSync(fullpath).mtime.toString().replace('+0800 (CST)','').replace(/( )([a-z]{3}) (\d{1,2})/gi,',$3 $2');
			res.writeHead(200,{
				'content-type': mime,
				'expires': expiresTime,
				'cache-control': 'max-age=' + maxAge,
				'last-modified': lastmodify,
				'server': 'wd-nodeserver'
			});
		}
			
		//不设置编码，返回buffer
		fs.readFile(fullpath,'',function(err,data){
			if(err){
				throw err;		
				return;
			}
			res.write(data);	
			res.end();
		});		
	}
	
};

/**
 * 静态文件夹处理
 */
exports.folder = function(res){
	res.writeHead(200,{
		'content-type': 'text/html',
		'server': 'wd-nodeserver'
	});
	res.end('visiting server dir,please visit file!');
};

/**
 * 404错误处理
 */
exports.handler404 = function(res){
	
	res.writeHead(200,{
		'content-type': 'text/html',
		'server': 'wd-nodeserver'
	});
	res.write('/*not found*/');
	res.end();
};
