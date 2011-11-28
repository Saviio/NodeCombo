#!/bin/sh
#后台启动node服务
sudo node /home/a.tbcdn.cn/run.js 

checknode(){
	#获取node pid
	nodepid=$(ps -e | grep node | awk '{print $1}');
	echo $nodepid
	#如果node进程id为空,则重新启动node
	if [ -z $nodepid ];then
		echo 'node is restart';
		sudo node /home/a.tbcdn.cn/run.js 
	fi
}

#开启定时检测
while true;do
	eval "checknode";
	sleep 5 
	continue	
done


