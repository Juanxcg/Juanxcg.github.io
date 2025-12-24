---
title: Unity关于AB包的学习
date: 5/31/2024
tags: Unity
categories: 学无止境
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20240308222857.jpg
---
# 前言
在Unity中也许大家都听过AB包这种加载资源的方法，但是可能都觉得很难，然后就不去学了，觉得自己写一个小项目怎么都用不到AB包，但是实际上并不是这样，AB包在个人项目中也会有很有趣的应用。

# Unity的AB包详解

## 概念解释

首先，Unity的AB包全称是AssetBundle，是Unity提供的一个用于储存资源的压缩包。

Unity中的AssetBundle系统是对资源管理的一种扩展，通过将资源分布在不同的AB包中可以最大程度地减少运行时的内存压力，可以动态地加载和卸载AB包，使其有选择地加载内容。

## AB包与Resources的对比区别

|      | AB包 |  Resources  |
| ----------- | ----------- | ----------- |
| 资源分布    | 可以分布在不同的包中      |  只能生成一个大包  |
| 存储位置  | 自定义路径        | 只能存在于Resources文件夹中 |
| 压缩方式 | 压缩方式可选（LZMA，LZ4） | 资源全部压缩为二进制 |
| 更新方式 | 可以支持后期更新 | 打包后变为可读不可后期更新 |

## AB包的特性

1. **不可重复加载**，只有卸载之后次啊可以再次加载
2. **不可打包代码**，AB包可以存储大部分的Unity资源，但是不可以直接存储C#脚本，脚本的热更新可以用Lua或者存储打包后的DLL文件
3. 打包完成后，会自动生成一个主包(主包名称随平台不同而不同)，主包的manifest下会存储有版本号、校验码(CRC)、所有其它包的相关信息（名称、依赖关系）

## AB包的常用API

```Csharp
//AB包加载所需相关API
//1. 根据路径进行加载AB包 注意AB包不能重复加载
AssetBundle ab = AssetBundle.LoadFromFile(path);
//2. 加载ab包下指定名称和类型的资源
T obj = ab.LoadAsset<T>(ResourceName); //泛型加载
Object obj = ab.LoadAsset(ResourceName); //非泛型加载 后续使用时需强转类型
Object obj = ab.LoadAsset(ResourceName,Type); //参数指明资源类型 防止重名
T obj = ab.LoadAssetAsync<T>(resName); //异步泛型加载
Object obj = ab.LoadAssetAsync(resName); //异步非泛型加载
Object obj = ab.LoadAssetAsync(resName,Type); //参数指明资源类型 防止重名
//3. 卸载ab包 bool参数代表是否一并删除已经从此AB包中加载进场景的资源（一般为false)
ab.UnLoad(false); //卸载单个ab包
AssetBundle.UnloadAllAssetBundles(false); //卸载所有AB包
```

## AB包的基本步骤

1. 加载资源所在AB包及其的所有依赖包（根据主包的manifest信息找依赖包名称）
2. 从AB包中加载指定的资源（根据名称，类型）
3. 不再使用时卸载已经加载了的AB包

## AB包简单管理系统

```Csharp
using System;
using System.Net.Mime;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Common
{
    /// <summary>
    /// AB包管理器 全局唯一 使用单例模式
    /// </summary>
    public class ABManager : MonoSingleton<ABManager>
    {
        //AB包缓存---解决AB包无法重复加载的问题 也有利于提高效率。
        private Dictionary<string, AssetBundle> abCache;

        private AssetBundle mainAB = null; //主包

        private AssetBundleManifest mainManifest = null; //主包中配置文件---用以获取依赖包

        //各个平台下的基础路径 --- 利用宏判断当前平台下的streamingAssets路径
        private string basePath { get
            {
            //使用StreamingAssets路径注意AB包打包时 勾选copy to streamingAssets
#if UNITY_EDITOR || UNITY_STANDALONE
                return Application.dataPath + "/StreamingAssets/";
#elif UNITY_IPHONE
                return Application.dataPath + "/Raw/";
#elif UNITY_ANDROID
                return Application.dataPath + "!/assets/";
#endif
            }
        }
        //各个平台下的主包名称 --- 用以加载主包获取依赖信息
        private string mainABName
        {
            get
            {
#if UNITY_EDITOR || UNITY_STANDALONE
                return "StandaloneWindows";
#elif UNITY_IPHONE
                return "IOS";
#elif UNITY_ANDROID
                return "Android";
#endif
            }
        }

        //继承了单例模式提供的初始化函数
        protected override void Init()
        {
            base.Init();
            //初始化字典
            abCache = new Dictionary<string, AssetBundle>();
        }


        //加载AB包
        private AssetBundle LoadABPackage(string abName)
        {
            AssetBundle ab;
            //加载ab包，需一并加载其依赖包。
            if (mainAB == null)
            {
                //根据各个平台下的基础路径和主包名加载主包
                mainAB = AssetBundle.LoadFromFile(basePath + mainABName);
                //获取主包下的AssetBundleManifest资源文件（存有依赖信息）
                mainManifest = mainAB.LoadAsset<AssetBundleManifest>("AssetBundleManifest");
            }
            //根据manifest获取所有依赖包的名称 固定API
            string[] dependencies = mainManifest.GetAllDependencies(abName);
            //循环加载所有依赖包
            for (int i = 0; i < dependencies.Length; i++)
            {
                //如果不在缓存则加入
                if (!abCache.ContainsKey(dependencies[i]))
                {
                    //根据依赖包名称进行加载
                    ab = AssetBundle.LoadFromFile(basePath + dependencies[i]);
                    //注意添加进缓存 防止重复加载AB包
                    abCache.Add(dependencies[i], ab);
                }
            }
            //加载目标包 -- 同理注意缓存问题
            if (abCache.ContainsKey(abName)) return abCache[abName];
            else
            {
                ab = AssetBundle.LoadFromFile(basePath + abName);
                abCache.Add(abName, ab);
                return ab;
            }


        }
        
        
        //==================三种资源同步加载方式==================
        //提供多种调用方式 便于其它语言的调用（Lua对泛型支持不好）
        #region 同步加载的三个重载
        
        /// <summary>
        /// 同步加载资源---泛型加载 简单直观 无需显示转换
        /// </summary>
        /// <param name="abName">ab包的名称</param>
        /// <param name="resName">资源名称</param>
        public T LoadResource<T>(string abName,string resName)where T:Object
        {
            //加载目标包
            AssetBundle ab = LoadABPackage(abName);

            //返回资源
            return ab.LoadAsset<T>(resName);
        }

        
        //不指定类型 有重名情况下不建议使用 使用时需显示转换类型
        public Object LoadResource(string abName,string resName)
        {
            //加载目标包
            AssetBundle ab = LoadABPackage(abName);

            //返回资源
            return ab.LoadAsset(resName);
        }
        
        
        //利用参数传递类型，适合对泛型不支持的语言调用，使用时需强转类型
        public Object LoadResource(string abName, string resName,System.Type type)
        {
            //加载目标包
            AssetBundle ab = LoadABPackage(abName);

            //返回资源
            return ab.LoadAsset(resName,type);
        }

        #endregion
        
        
        //================三种资源异步加载方式======================

        /// <summary>
        /// 提供异步加载----注意 这里加载AB包是同步加载，只是加载资源是异步
        /// </summary>
        /// <param name="abName">ab包名称</param>
        /// <param name="resName">资源名称</param>
        public void LoadResourceAsync(string abName,string resName, System.Action<Object> finishLoadObjectHandler)
        {
            AssetBundle ab = LoadABPackage(abName);
            //开启协程 提供资源加载成功后的委托
            StartCoroutine(LoadRes(ab,resName,finishLoadObjectHandler));
        }

        
        private IEnumerator LoadRes(AssetBundle ab,string resName, System.Action<Object> finishLoadObjectHandler)
        {
            if (ab == null) yield break;
            //异步加载资源API
            AssetBundleRequest abr = ab.LoadAssetAsync(resName);
            yield return abr;
            //委托调用处理逻辑
            finishLoadObjectHandler(abr.asset);
        }
        
        
        //根据Type异步加载资源
        public void LoadResourceAsync(string abName, string resName,System.Type type, System.Action<Object> finishLoadObjectHandler)
        {
            AssetBundle ab = LoadABPackage(abName);
            StartCoroutine(LoadRes(ab, resName,type, finishLoadObjectHandler));
        }
        
       	
        private IEnumerator LoadRes(AssetBundle ab, string resName,System.Type type, System.Action<Object> finishLoadObjectHandler)
        {
            if (ab == null) yield break;
            AssetBundleRequest abr = ab.LoadAssetAsync(resName,type);
            yield return abr;
            //委托调用处理逻辑
            finishLoadObjectHandler(abr.asset);
        }

        
        //泛型加载
        public void LoadResourceAsync<T>(string abName, string resName, System.Action<Object> finishLoadObjectHandler)where T:Object
        {
            AssetBundle ab = LoadABPackage(abName);
            StartCoroutine(LoadRes<T>(ab, resName, finishLoadObjectHandler));
        }

        private IEnumerator LoadRes<T>(AssetBundle ab, string resName, System.Action<Object> finishLoadObjectHandler)where T:Object
        {
            if (ab == null) yield break;
            AssetBundleRequest abr = ab.LoadAssetAsync<T>(resName);
            yield return abr;
            //委托调用处理逻辑
            finishLoadObjectHandler(abr.asset as T);
        }


        //====================AB包的两种卸载方式=================
        //单个包卸载
        public void UnLoad(string abName)
        {
            if(abCache.ContainsKey(abName))
            {
                abCache[abName].Unload(false);
                //注意缓存需一并移除
                abCache.Remove(abName);
            }
        }

        //所有包卸载
        public void UnLoadAll()
        {
            AssetBundle.UnloadAllAssetBundles(false);
            //注意清空缓存
            abCache.Clear();
            mainAB = null;
            mainManifest = null;
        }
    }
}
```

这里继承的单例脚本可以在我之前的博客中的实用技巧中找到。

## AB包的压缩方式

三种压缩方式

- NoCompression:不压缩，解压快，包较大，不建议使用。
- LZMA: 压缩最小，解压慢，用一个资源要解压包下所有资源。
- LZ4: 压缩稍大，解压快，用什么解压什么，内存占用低，更建议使用。

## AB包的工作全流程

> 可以借助Unity官方提供的包管理插件AssetBundle Browser来完成
>
>https://github.com/Unity-Technologies/AssetBundles-Browser

1. 在需要打包的资源的Inspector面板下方即可选择其应放在哪个AB包下，也可通过New新建AB包将资源放入，放入后再次Build打包即可将此资源打入相应的AB包中。
2. 在Windows中可以打开AssetBundle Browser来看具体打包信息。
3. 使用AB包的API来完成资源的自定义加载。