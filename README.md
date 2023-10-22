# fish-cli-dev
## 创建项目
### 项目/组件初始化

``fish-cli-dev init ``

### 强制清空当前文件夹

fish-cli-dev init --force
## 发布项目
### 发布项目/组件

fish-cli-dev publish
### 强制更新所有缓存

fish-cli-dev publish --force
### 正式发布

fish-cli-dev publish --prod
### 手动指定build命令

fish-cli-dev publish --buildCmd "npm run build:test"
## More
### 清空本地缓存：

fish-cli-dev clean

### DEBUG 模式：

fish-cli-dev --debug
调试本地包：

fish-cli-dev init --packagePath /Users/sam/Desktop/imooc-cli/packages/init/
