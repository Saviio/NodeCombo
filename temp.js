/**
 * 简单模板处理器
 * @author: 栋寒
 * @email: donghan@taobao.com
 */

var parseUrl = require('url').parse,
	querystring = require('querystring'),
	fs = require('fs'),
	path = require('path');
var static = require('./static');

/**
 * 统一的外部访问接口
 * @param req{object} 请求头信息
 * @param res{object} 响应头信息
 * @pram temPath{string} 请求模块的路径
 * @return void
 * @memberOf temp
 */
exports.action = function(req,res,temPath){
	if(!path.existsSync(temPath)){
		static.handler404(res);	
		return;
	}
	req.method == 'GET' ? getType(req,res,temPath) : postType(req,res,temPath);	
};

/**
 * 处理get请求
 * @param 参见temp.action
 */
var getType = function(req,res,temPath){
	var urlobj = parseUrl(req.url),
		query = querystring.parse(urlobj.query);	
	handlerJst(res,query,temPath);
};

/**
 * 处理post请求
 * @param 参见temp.action
 */
var postType = function(req,res,temPath){
	var postData = '';
	req.on('data',function(data){
		postData += data;	
	}).on('end',function(){
		var query = querystring.parse(postData);
		handlerJst(res,query,temPath);
	});
	req.setMaxListeners(0);
};

/**
 * 简单的模板处理器(仅考虑get\post,诸如delete不考虑)
 * @param res 参见temp.action
 * @param query{obj} 查询字段对象,如{'id':'zhenn','pwd':'hello1234'}
 * @param temPath 参见temp.action
 */
var handlerJst = function(res,query,temPath){
	//使用异步回调
	fs.readFile(temPath,'utf8',function(err,data){
		if(err){
			throw err;
			return;
		}	
		res.writeHead(200,{
			'content-type': 'text/html;charset=utf-8',
			'server': 'wd-nodeserver'
		});
		try{
			var result = eval(data);
		}catch(e){
			//只要不抛出异常，无论try语句中是语法错误还是执行错误，js程序执行就不会中断（node服务不会挂掉）
			//这点和浏览器端表现不一致,
			//throw e.message; 
			var result = temPath + '在执行过程中，发生如下异常: <br><strong style="color:red;">' + e.message + '</strong>';
		}
		res.end(result);
	});	
};
