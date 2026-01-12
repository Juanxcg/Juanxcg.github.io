---
title: AssistProject
date: 2026-01-12 14:56:23
tags: Unity
categories: 学无止境
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/Head.jpg
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/Bag.jpg
---

# 前述

最近我的项目从用Git转到了用SVN，所以记录一下这一篇帖子，用来记录Unity各个文件夹的作用，当多人协作项目的时候需要同步哪些文件夹。同时也写一下我自己认为的项目文件夹命名规范。

# 总结

如果要转移一个项目，需要纳入协作的文件有

* Assets  

> 这是项目资源的主目录，unity 项目中的所有资源都必须在此目录下才能在 project 面板中出现，其中包含了你的代码与资源。
* Packages

> 这是记录了包依赖的文件夹，即Unity Package Manager。

* ProjectSettings

> 项目级设置，不同平台/分支会变动，协作时务必提交。

# Assets目录拆解

Assets/
  - _Project        
   项目自研内容
    - Scripts
    存放 C#、Shader 脚本，代码内容
    - **Editor**
    放在此目录的脚本将被视为编辑器脚本，编辑器脚本为编辑器提供一些扩展或定制功能，但是无法在运行时使用。
    editor 文件夹可以放置在 assets 目录中的任意子目录中
    - Scenes           
    场景文件
    - Prefabs          
    预制体
    - Materials       
    材质
    - Shaders          
    Shader 与着色资源
    - Textures         
    贴图
    - Models          
    模型
    - Audio           
    音频
    - Animations       
    动画与 Animator Controller
    - UI               
    UI 相关素材与预制
    - **Resources**        
    资源文件夹，主要的美术素材、音频、视频、模型、特效、动画等资源存放地址。该目录下的内容在打包时都会被打到发布包中。工程版本资源直接使用 Resource 加载方式，发布阶段根据项目需求统一切换资源加载方案。
    同 editor 一样，可以在主目录下任意子目录中存在。
    只读，即不能动态修改。
    将文件夹内的资源打包集成到.asset 文件里面。
    主线程加载。
      - Animation 动画
      - Audios 音频
      - Fonts 字体
      - Materials 材质
      - Models 模型
      - Prefabs 预制体
      - SFXs 特效
      - Sprites 精灵
      - Videos 视频
      - 其他文件夹
  - ThirdParty     
  开源库、SDK 等第三方资源
  - **Gizmos**         
  这个文件夹允许你将一些图标添加到场景中，作为一些辅助标示，比如可以标示出一些正常情况下看不见的线或点，使用 gizmos.drawicon 方法可以在场景中绘制图标用来做一些特殊的标记，当然前提是你得将图标放到 gizmos 文件夹中，这样 drawicon 方法才能找到它。
  gizmos 目录需要全局唯一，和 editor 不一样，它得固定放到跟目录下，就是说它的上一级只能是 assets
  - **Plugins**         
  插件文件夹，用来放置一些三方的库插件，比如 ngui，或者是一些 dll 库，比如 json、dotween 等三方库，也可以放置你自己封装的 dll 文件。
  同 gizmos 一样，全局唯一，必须在根目录下
  - **Standard Assets**
  标准资源文件夹，存放 unity 提供的标准资源文件的文件夹
  - **StreamingAssets**
  用于存放一些流文件，比如音视频文件、二进制文件、assetbundle 文件。
  和 Resources 文件的区别就是 Resources 文件夹中的内容在打包时会被压缩和加密。而 StreamingAsset 文件夹中的内容则会原封不动的打入包中，因此 StreamingAssets 主要用来存放存放打包的 AB 资源，然后用户安装包之后把这些 AB 资源是放到手机内。
  全局唯一，存放在根目录下。
  只读，可以放一些压缩的 AB 资源。
  只能用过 WWW 类（新版本都已采用 UnityWebRequest 来取代 WWW）来读取。
  - 其他下载包的文件夹（例如 AddressableAssetsData）


# Packages & ProjectSettings

Pakcages 一般只有两个文件

`manifest.json` 与 `packages-lock.json` 共同决定依赖，团队统一安装后直接提交

这套包管理器是类似npm的结构，其中`manifest.json`配置了每个package的版本号信息，`packages-lock.json`配置实际使用的包版本。

ProjectSettings是工程项目配置路径，Unity ProjectSettings里的配置都是写到这个路径下的配置文件里的。

附上一个常用的Git的ignore

```
# ===== Unity 临时缓存（可再生成）=====
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Mm]emoryCaptures/
UserSettings/

# ===== Unity 录制与诊断输出 =====
[Rr]ecordings/
sysinfo.txt
mono_crash.*

# ===== IDE 与工程配置（自动生成）=====
.vs/
.gradle/
ExportedObj/
.consulo/
.idea/
.vscode/
*.code-workspace
*.DotSettings.user

# ===== 解决方案与调试产物 =====
*.csproj
*.unityproj
*.sln
*.suo
*.tmp
*.user
*.userprefs
*.pidb
*.pidb.meta
*.booproj
*.svd
*.pdb
*.pdb.meta
*.mdb
*.mdb.meta
*.opendb
*.VC.db

# ===== 构建输出与分发包 =====
*.apk
*.aab
*.unitypackage

# ===== 第三方插件（按需忽略示例）=====
# JetBrains Rider 插件（Unity 自动生成）
[Aa]ssets/Plugins/Editor/JetBrains*
# Asset Store 工具（若不需提交请取消注释）
#[Aa]ssets/AssetStoreTools*
# Ludiq Peek 示例
Assets/Ludiq/Ludiq.PeekCore
Assets/Ludiq/Ludiq.Peek
Assets/Ludiq.Generated/Transient
# Odin Inspector 演示与 AOT 输出
Assets/Plugins/Sirenix/Assemblies/AOT/*
Assets/Plugins/Sirenix/Demos/*
!/Assets/Plugins/Sirenix/Demos/*.unitypackage
# Gaia 示例资源
Assets/Procedural*Worlds/Gaia/Asset*Samples/*
Assets/Samples/Terrain*Tools/*

# ===== 系统垃圾文件（macOS / Windows）=====
.DS_Store
.AppleDouble
.LSOverride
Icon
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
*.stackdump
[Dd]esktop.ini
$RECYCLE.BIN/
*.cab
*.msi
*.msix
*.msm
*.msp
*.lnk
```

# 其他文件夹

## Library目录

Library目录放置了Unity导入后的资源，打包构建的中间文件，还有package

什么叫做导入，比如向Unity的Assets目录里，随便创建个文件夹，然后放入一张smile.png笑脸图，那Unity之后运行游戏时，用到这张图时是直接用这张png图吗？当然不是的，Unity要把这张png图资源转换成某种Unity可用的文件格式并放到Library目录，这个转换过程就是资源的导入。只有被导入完的资源，才是能被Unity使用的资源。并且因为最终的输出平台（Android，iOS，Win，Macos）需要的资源导入设置不一样，对图的导入处理也可能有不同。

## Log目录

非常明显的文件夹，写入一些日志，但是注意UnityEditor.log以及很多特殊的log不在这里。
详情请看[Unity官方文档](https://docs.unity3d.com/Manual/log-files.html)。

## Temp目录

临时路径，Unity编辑器退出时这个目录会被删除掉，Unity会把一些处理的中间结果放到这个路径下，注意目录里有个名为UnityLockfile的文件，这个是用来标志这个Unity工程已经被某个Unity编辑器打开了。如果UnityLockfile在工程打开使用中被删了，那么Unity编辑器是能同时多次打开同一工程的，当然这样做会有各种奇怪报错的问题。

## UserSettings目录

通常记录用户配置和界面布局

---

# 结尾

> 分享一个很有意思的帖子，记录了Unity文档里语焉不详的黑暗角落 [The Uninomicon](https://uninomicon.com/start#selected_pages)。

> 参考:
[Unity的工程中文件夹介绍](https://blog.csdn.net/zdyykiller/article/details/133972292)。
[Unity 常用工程目录结构与实践](https://xiaoyunhai0.github.io/2025/10/01/unity%E5%B8%B8%E7%94%A8%E5%B7%A5%E7%A8%8B%E7%9B%AE%E5%BD%95/#Assets-%E7%9B%AE%E5%BD%95%E6%8B%86%E8%A7%A3)。
[Unity开发规范：目录规范](https://indienova.com/indie-game-development/unity-develop-standards-directory-standards/)。