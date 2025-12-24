---
title: Spine-Unity的使用
date: 4/9/2024
tags: Unity
categories: 学无止境
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/Spine-Unity.jpg
---
# 前述

这是我第一次在`unity`中使用`spine`导入的动画而总结出的各个注意事项吧，哎，我能搜到的资料太少了，只能自己慢慢摸索，希望写的这一篇博客可以帮助有需要的人。（使用的`spine`为2D）

# 关于导入unity包和Spine导出文件的问题

这是一些前置工作，当时搜教程都没有很详细的介绍，导致搞了好久，甚至反反复复导入了好几次。

## 导入unity关于Spine的包

> Spine关于Unity包的官方地址：https://zh.esotericsoftware.com/spine-unity-download/

在这一步一定要知道自己要使用的`Spine`软件的版本，根据前两位来选择相应的unity包，就比如3.8.~
，在包中就要选择`spine-unity 3.8`。

之后下载了之后会得到一个unity包，直接拖入unity即可。

## Spine导出文件的选择

在Json和二进制之间，我更推荐二进制，更轻量，但是都是一个步骤，这里按二进制来教学。

在点击导出按钮之后按照这个选项，注意后缀，其实是unity能够识别的就行。

![QQ图片20240409181254.png](https://s2.loli.net/2024/04/09/p5kyrxHUGCPLiEt.png)

输出时选中`预乘Alpha`，在图集中也是注重后缀

![QQ图片20240409181309.png](https://s2.loli.net/2024/04/09/gnDGyECwqXoAe6S.png)

之后导出一般就是图集和两个文件，后缀时前面设置的样子。

## 导入unity

将上述导出的文件拖入unity的Assets就会解析了生成`XX_SkeletonData.asset`后缀文件了，之后的操作一般都是基于这个文件来做。

## unity导入3.8.75版本的error

在导入文件时，如果是3.8.75学习版的Spine注意会有Error，但是只需要点进去锁定Error那一行，将代码改为：

```csharp
if ("3.8.xx" == skeletonData.version)
```

就能解决这个Error，只能说是Spine官方对学习版深恶痛绝……

# 在unity中使用Spine导出的动作

## Spine文件的基本使用

在unity中要想使用Spine导出的动作，不能直接放到场景中，它有一个类似于`Animator`的组件`SkeletonAnimation`，在这里面放入`XX_SkeletonData.asset`后缀文件就能正常使用了。
同时如果是UI的Spine文件，那么就使用`SkeletonGraphic(UI)`当然，它后面也标注了UI。

如果在`inspector`中遇到了这个Error：

![屏幕截图 2024-04-09 184143.png](https://s2.loli.net/2024/04/09/bmoxH4EnSBQTrky.png)

那么只需要在unity解析出的material材质文件中将这一个选项勾选即可
![屏幕截图 2024-04-09 184157.png](https://s2.loli.net/2024/04/09/wSVIQeLuiZdUW57.png)

至此你就已经在unity中导入了相关的spine文件了。

## Spine动画的怎么添加碰撞体

用过unity动画系统的都知道怎么使用每一帧来调整碰撞系统，但是在spine的文件中，并没有给我们每一帧都调整的方法，现在就有两个方法来调整：

### 使用unity原生的骨骼系统

在我们的SpineAnimation组件的GameObject上添加Skeleton Utility组件，在脚本中点击`Spawn Hierarchy`然后再弹出的窗口中选择`Follow all bones`，就会生成每一个骨骼的GameObject，之后就可以给每一个组件加上碰撞体了！

### 在Spine中解决

让美术在制作Spine动画的时候，在对应武器下面，增添一个`Binding Box`(中文叫边界框)，添加完成后，按照第一种做法，将骨骼显示出来，然后在对应的骨骼下，你会发现一个`binding box`选项，点击`binding box`，就会自动添加一个多边形碰撞器。