/**
 * combo管理器
 * auther: 栋寒
 * email: donghan@taobao.com
 */

var fs = require('fs'),
	path = require('path'),
	http = require('http'),
	static = require('./static'),
	transfer = require('./transfer');
var iconv = require('iconv').Iconv;
var buffer = require('buffer');
/**
 * combo管理
 * url:http://a.tbcdn.cn/apps/lottery??a.js,b,js
 * @param pathname{string} url的路径，/apps/lottery
 * @param search{string} 查询字符串 ??a,js,b.js
 * @param req{object} http请求头
 * @param res{object} http响应头
 * @return void
 */
exports.handlerCombo = function(pathname,search,req,res){
	//删除最后一个逗号
	search = search.replace(/,*$/gi,'');
	if(!static.minexp.test(search)){
		search = search.replace(/-min/gi,'');
	}
	//增加对combo时间戳的支持(仅限制在末尾处)
	var fileArr = search.replace('??','').replace(/\?.*$/gi,'').split(',');		
	//获取文件mime类型
	var mime = static.contype[path.extname(fileArr[0]).replace('.','')];
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
		
		/**
		 * localCombo combo连接中本地文件的个数
		 * remoteCombo 远程文件的个数
		 * isPush 已经push到缓存区的远程文件个数
		 */
		var localCombo = 0 , remoteCombo = 0;

		for(var i=0,len=fileArr.length;i<len;i++){
			if(path.existsSync(pathname.replace('/','') + fileArr[i])){
				localCombo++;
			}else{
				remoteCombo++; 	
			}	
		}
		//combo连接中全部是远程文件
		if(localCombo == 0){
			transfer.fetch(req,res,mime,pathname+ search);	
		}else if(localCombo == len){
			//全部是本地文件
			for(var i=0,len=fileArr.length;i<len;i++){
				res.write(fs.readFileSync(pathname.replace('/','') + fileArr[i],''));
			}	
			res.end('/*over*/');
		}else{
			//combo链接中既有本地文件又存在远程文件
			var i = 0 , len = fileArr.length;
			var resultArr = [], backnumber = 0 , resultStr = '';
			var newArr = [];
			while(i < len){
				if(path.existsSync(pathname.replace('/','') + fileArr[i])){
					(function(index){
						fs.readFile(pathname.replace('/','') + fileArr[index],function(err,data){
							resultArr.push({
								index: index,
								str: data
							});
							backnumber++;
							if(backnumber == len){
								for(var j = 0;j<len;j++){
									for(var k=0;k<len;k++){
										if(resultArr[k].index == j){
											newArr.push(resultArr[k].str);
										}	
									}
								}
								for(var h=0,_len=newArr.length;h<_len;h++){
									res.write(newArr[h]);	
								}
								res.end('/*over*/');
							}

						});
					})(i);

				}else{
					(function(index){
						http.get({
							host: transfer.targetHost,
							path: pathname+fileArr[i]
						},function(response){
							var result = ''
							response.setEncoding('binary');
							response.on('data',function(data){
								result += data
							}).on('end',function(){
								var str = result;
								//如果在生产环境存在此文件
								if(str.indexOf('<h1>404 Not Found</h1>') >= 0 ){
									str = '/*not found*/';
								}		
								resultArr.push({
									index: index,
									str: str
								});
								backnumber++;
								if(backnumber == len){
									for(var j = 0;j<len;j++){
										for(var k=0;k<len;k++){
											if(resultArr[k].index == j){
												newArr.push(resultArr[k].str);
											}	
										}
									}
									for(var h=0,_len=newArr.length;h<_len;h++){
										res.write(newArr[h]);	
									}
									res.end('/*over*/');
								}
							});
							response.setMaxListeners(0);
							
						});
					})(i);
				}
				i++;
			}

		}

	}
};


