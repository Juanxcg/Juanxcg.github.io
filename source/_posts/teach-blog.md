---
title: 用Hexo框架搭建博客教程
data: 3/6/2024
tags: Hexo
categories: 教程
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/hexo.png
---
# 前述
首先向大家说明为什么要搭建博客，很多人可能觉得博客没什么用，中看不中用那种，但是其实并不是这样，对于拥有一个个人的博客，最重要的事就是有了一个记录自己的学习路程并且可以方便的给别人展示的地方或者说是平台，无论以后是自己复习知识或者在自己简历上展示都是一个很好的方法，这一篇博客我就来说明自己搭建博客的过程。

在开始之前，我先点明我在搭建博客所用到的教程，希望对你们有所帮助：

[博客大佬写的以Next为主题的搭建流程](https://www.cnblogs.com/huanhao/p/hexobase.html)这个是对我帮助的最大的一个教程里面的流程十分清楚，但是可能是四年前的教学，有些对于初学者不太懂的东西没有提到，所以我也花费了很大的功夫才搭成了这个博客。

# 搭建博客
## 前置工具
在开始搭建博客之前，我们需要下载前置的各种软件，我会在下面一一列出：

### Node.js
>下载地址:https://nodejs.cn/download/

**PS:如果以前下载过Node.js的朋友建议去更新一下版本，或者直接安装覆盖，因为之后用Hexo选主题会有很多主题不支持老版本的Node.js会出现很多莫名其妙的错误**

可以安装到别的盘，不用非要安装在系统盘。

建议下载长期支持的版本，新的版本可能会有稀奇古怪的bug

![Node-setup.png](https://s2.loli.net/2024/03/06/oQu7JWdFfUbsOn2.png)

安装的时候记得选`Add To Path`不然之后在命令行操作会识别不到。

### git
>下载地址：https://git-scm.com/

![git-setup-1.png](https://s2.loli.net/2024/03/06/uq4RPyEgnMwsb3v.png)

点击`DownLoad`即可下载最新版。

选择合适的安装位置之后一直点Next就好。

安装之后在桌面上右键即可验证:

![git-setup-2.png](https://s2.loli.net/2024/03/06/i1CtzB2bKZVSqe6.png)

点击Open Git Bash here。

分别输入

```shell
$ node -v
$ npm -v
```

![git-setup-3.png](https://s2.loli.net/2024/03/06/4vQUSHfidWKsZl9.png)

如果能够看到版本号就算安装完成了。

### cnpm
cnpm是一个国内的对于Node.js上的npm的镜像工具，能够加速各种插件的下载，npm在安装插件的时候经常会卡住，所以就会有这个镜像。

想要配置也很简单，在刚刚的git命令行中执行以下命令

```shell
$ npm install -g cnpm --registry=https://registry.npm.taobao.org
```

这个代码大致意思就是用npm下载cnpm但是是借用的国内的淘宝NPM镜像下载。

之后在命令行中输入

```shell
$ cnpm -v
```

如果输出版本号就是安装成功了。

### Hexo

**安装之前先介绍一下Hexo:** Hexo是借助于Node.js的快速、简洁且高效的博客框架，并且里面会有很多博客的主题，所以被很多人应用在自己的博客框架搭建中。

>官方文档：https://hexo.io/zh-cn/docs/index.html

在git bash命令行中执行以下命令

```shell
$ cnpm install hexo-cil -g
```

到现在我们所有的前置工具都已经配置完成了。

## 初始化博客

选择一个位置创建自己的博客本地文件夹，然后右键打开git bash

![blog-1.png](https://s2.loli.net/2024/03/06/Ffew6lkc7XM38Hv.png)

注意我这是已经搭建完的文件，你的文件夹应该是完全空的。

**（PS:一定要是在自己创建的文件夹的内部打开git bash）**

在命令行中输入以下命令
```shell
$ hexo init
```
这个代码意思是用hexo初始化自己的博客框架

回车之后可能会卡在`Install dependecies`这一步，这时候按`Ctrl + c`结束命令，并输入下列代码来继续安装
```shell
$ cnpm install
```
>也可以用github的地址来提取，代码如下
>```shell
> $ git clone https://e.coding.net/huanhao/hexoblog.git
>```


等待完成上述命令之后，自己的博客就完成初始化了！

用下面的代码来看看自己博客吧！

```shell
$ hexo s
```
将出现的地址复制到浏览器打开就是自己博客了（本地端）

**（PS：在命令行中复制粘贴并不是`Ctrl + c`和`Ctrl + v`如果不熟悉可以右键找`Copy`和`Paste`）**

# 美化博客
## 寻找合适的主题

在Hexo的博客搭建中，换一个好看的页面就和自己在手机上换主题一个道理，而且大部分的主题都支持高度的自定义，完全能搭建出有自己的风格的博客。

想要换到自己想要的页面就去下面这个地址去挑吧:

>https://hexo.io/themes/

但是在挑选主题的时候一定要看这个主题的说明文档，很多主题的文档非常不全！我前面推翻重搭的原因也有很多是因为这个文档中的问题解决非常少！让我遇到问题都无从下手！！！[😡]

这里我用我的主题butterfly为例演示主题的安装，butterfly的文档是非常完善的，并且配置起来是很方便的。

>主题首页：https://butterfly.js.org/ 
>
>主题github地址：https://github.com/jerryc127/hexo-theme-butterfly

## 下载主题

点击绿色的`Code`

在主页中复制到主题的https的地址

![theme-1.png](https://s2.loli.net/2024/03/06/J3jkGQyWeV76z5L.png)

在博客文件夹中打开git bash执行以下代码
```shell
$ git clone 复制的地址 themes/主题名字
```
代码分析：`git clone` 是克隆 `地址` 中的内容到 `themes/新的文件夹` 中,其中的地址与名字是要更换的，地址就是你复制的https的地址，主题名字是butterfly。

>也可以在github中把整个主题下载成Zip压缩文件解压放到文件夹中的themes中

## 配置文件

在你创建的博客目录中应该会有 `_config.yml` 文件，你可以选择用记事本打开或者万能的vscode，在文件中找到 `themes` 这一行，将主题名字改为butterfly，这样就是告诉hexo要启动这个主题。

![theme-2.png](https://s2.loli.net/2024/03/06/pZC1Uhcr4oVRWkx.png)

## 补充缺失的组件

接下来再运行你所搭建的博客

```shell
$ hexo s
```

你很有可能遇到如下错误
```shell
Error: Cannot find module '某个组件'
```

这就是某些主题用了Node.js安装的时候没有的组件，这时候你就可以就用npm安装相关组件

```shell
$ npm install '组件名'
```

直接把组件名复制过来，用npm安装。

>**(PS：如果回车之后长时间不动的，就换成用cnpm安装**
>```shell
> $ cnpm install '组件名'
>```
>**)**

等安装完所有组件之后用

```shell
$ hexo s
```

就是一个你喜欢主题的本地博客了！

# 上传博客
## 创建远程仓库

打开自己的github主页

![up-1.png](https://s2.loli.net/2024/03/06/jZGuv6xYep7d3IH.png)

点击绿色的 `New` ，进入到下面的界面。

![up-2.png](https://s2.loli.net/2024/03/06/DVn6zY8lXTJNLMs.png)

创建的时候将仓库名设为：个人的github名字.github.io，至于为什么这么设我们之后会提到。

其他的设置可以不用动，点击 `Create repository` 就创建好了新的仓库。

## 配置SSH密钥

如果github已经配置好密钥的可以直接跳过。

打开git bash命令行（不要求位置）输入以下命令

```shell
$ ssh-keygen -t rsa -C “你的邮箱“
```

将其中的邮箱换成你的github邮箱，得到SSH密钥，在执行之后一直按回车直到命令结束，接着输入

```shell
$ cat ~/.ssh/id_rsa.pub
```

执行之后会得到你的SSH密钥，复制输出的信息

点击github仓库页右上角你的头像，在弹出的信息中点击 `Settings` ,在左侧设置中找到 `SSH and GPG keys` ，点击`New SSH key` 将自己复制的密钥粘贴上点击 `Add SSH key`。

这样你的SSH密钥就配置成功了

## 将博客上传到github

输入下列代码

```shell
$  ssh -T git@github.com
```
等到它提示以下代码，输入yes并回车
```shell
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```
在仓库页面点击蓝色框中的 `SSH` 并复制后面的内容

![up-3.png](https://s2.loli.net/2024/03/06/3Q1OfBjxRMXzop6.png)

回到自己的博客文件夹，打开 `_config.yml` 文件，将最后的代码改为如下代码

```shell
deploy:
  type: git
  repo: 你复制的地址
  branch: master
```

在博客文件夹中打开 git bash 分别执行以下命令

```shell
$ git config --global user.name "你的名字"
```
```shell
$ git config --global user.email "你的邮箱"
```

然后安装上传的插件

```shell
$ cnpm install hexo-deployer-git --save
```
等安装之后输入以下代码上传博客框架

```shell
$ hexo g -d
```
等执行完之后就算是上传完成了！

# 打开博客

上传之后刷新github仓库然后点击上方的 `Settings` 在左侧选择 `Pages`

![open.png](https://s2.loli.net/2024/03/06/qunKvOkITCNfV8F.png)

看自己的 `Build and deploy ment` 这一栏的 `Branch` 是不是已经配置好了，如果是 `None` 就选中 `main` 作为自己的 `page` 的枝干，这里就解释一下为什么仓库名字一定要是固定的了，因为github的博客 `page` 要指定的仓库名才能创建出自己专属的博客网站，不然hexo的主题会丢失。

到这一步之后就是等一会刷新一下啦，下面会弹出你的专属博客网站啦。

博客的自定义详情见主题的官方文档和Hexo的文档。