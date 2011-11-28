#!/bin/sh
ps -e | grep node | awk '{print $1}' | xargs sudo kill -9
echo 'node service is stoped.'
