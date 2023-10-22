# fish-cli-dev
##创建项目
###项目/组件初始化
imooc-cli init 

强制清空当前文件夹

imooc-cli init --force
发布项目
发布项目/组件

imooc-cli publish
强制更新所有缓存

imooc-cli publish --force
正式发布

imooc-cli publish --prod
手动指定build命令

imooc-cli publish --buildCmd "npm run build:test"
More
清空本地缓存：

imooc-cli clean
DEBUG 模式：

imooc-cli --debug
调试本地包：

imooc-cli init --packagePath /Users/sam/Desktop/imooc-cli/packages/init/
