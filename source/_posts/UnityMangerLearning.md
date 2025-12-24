---
title: Unity基本框架
date: 4/6/2024
tags: Unity
categories: 学无止境
top_img: /image/backGround.png
cover: /image/UnityLearning/UnityMangerLearning.jpg
---
# 前述

总结的一些Unity的常用框架

# UI

这是我根据网上的一些框架自己总结写出的基本框架，感觉比较好用。

## UIManger

```Csharp
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using QFramework;
using UnityEditor;
using UnityEngine;
using UnityEngine.Events;

namespace UI
{
    public class UIManager
    {
        //处理单例模式
        private static UIManager _instance;

        public static UIManager Instance
        {
            get
            {
                if (_instance == null)
                    _instance = new UIManager();
                
                return _instance;
            }
        }

        public UIManager()
        {
            //生成后自动更新文件
            UIPanelInfoSaveInJson();
            //MenuBGInfoSaveInJson();
        }

        private Transform canvasTransform;

        public Transform CanvasTransform
        {
            get
            {
                if (canvasTransform == null)
                    canvasTransform = GameObject.Find("Canvas").transform;
                return canvasTransform;
            }
        }

        //数组（记录下的面板）
        private List<UIPanel> panelList;

        //字典保存场景内的面板
        private Dictionary<EUIPanelType, BasePanel> panelDict;

        //面板栈
        private Stack<BasePanel> panelStack;

        
        //回调委托
        UnityAction finishEvent;

        #region 数据相关

        #region 关于Panel的Json数据的代码

        //UI面板预制体文件夹,如果预制体的文件夹位置不同请更改这部分代码
        readonly string panelPrefabPath = Application.dataPath + @"/Resources/Prefabs/UIPanelPrefab";

        //UI面板数据保存文件,如果想要改变Json储存位置请改变这一段代码
        readonly string panelJsonPath = Application.streamingAssetsPath + @"/Json/GameSetting/UIJson.json";


        //自定义的读Json方法，用来得到Json中的列表
        public List<UIPanel> ReadPanelJsonFile()
        {
            //如果找不到UIJson文件，则新建一个Json文件并写入“[]”
            if (!File.Exists(panelJsonPath))
                File.WriteAllText(panelJsonPath, "[]");
            List<UIPanel> list = JsonConvert.DeserializeObject<List<UIPanel>>(File.ReadAllText(panelJsonPath));
            return list;
        }

        //自定义的写Json方法，用来刷新Json
        public void WritePanelJsonFile()
        {
            string json = JsonConvert.SerializeObject(panelList);
            File.WriteAllText(panelJsonPath, json);
        }

        //自动更新UI面板数据保存文件
        public void UIPanelInfoSaveInJson()
        {
            panelList = ReadPanelJsonFile();
            DirectoryInfo folder = new DirectoryInfo(panelPrefabPath);

            //遍历储存面板prefab的文件夹里每一个prefab的名字，并把名字转换为对应的UIPanelType
            //检查UIPanelType是否存在于List里,若存在List里则更新path,若不存在List里则加上
            foreach (FileInfo file in folder.GetFiles("*.prefab"))
            {
                //把prefab里的文件夹中的prefab的名字string类型转换成EUIPanelType类型方便后续操作
                EUIPanelType type = (EUIPanelType)Enum.Parse(typeof(EUIPanelType), file.Name.Replace(".prefab", ""));

                //这里的path是相对路径，因为加载时使用的是Resources.load
                //如果使用的是其他的加载方式请更改这一部分代码
                string path = @"Prefabs/UIPanelPrefab/" + file.Name.Replace(".prefab", "");

                //默认该UIPanel不在现有UIPanelList中
                bool uiPanelExistInList = false;

                //在List里查找type相同的UIPanel(这是一个自定义方法)
                UIPanel uIPanel = panelList.SearchPanelForType(type);

                //UIPanel在该List中,更新path值
                if (uIPanel != null)
                {
                    uIPanel.UIPanelPath = path;
                    uiPanelExistInList = true;
                }

                //UIPanel不在List中,加上该UIPanel
                if (uiPanelExistInList == false)
                {
                    UIPanel panel = new UIPanel(type, path);
                    panelList.Add(panel);
                }
            }

            //把更新后的UIPanelList写入Json
            WritePanelJsonFile();
#if UNITY_EDITOR
            AssetDatabase.Refresh(); //刷新资源
#endif
        }

        #endregion

        #endregion

        #region 面板相关设置

        /// <summary>
        /// 获取相关面板
        /// </summary>
        /// <param name="type">面板的枚举类型</param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public BasePanel GetPanel(EUIPanelType type)
        {
            if (panelDict == null)
                panelDict = new Dictionary<EUIPanelType, BasePanel>();

            //获取枚举类型为type的BasePanel
            BasePanel Panel1 = panelDict.TryGetValue(type);

            //如果没有找到，则创建一个
            if (Panel1 == null)
            {
                string path = panelList.SearchPanelForType(type).UIPanelPath;

                if (path == null)
                    throw new Exception("找不到该UIPanelType的Prefab");

                if (Resources.Load(path) == null)
                    throw new Exception("找不到该Path的Prefab");

                GameObject instPanel = GameObject.Instantiate(Resources.Load(path)) as GameObject;
                //创建为Canvas的子物体
                instPanel.transform.SetParent(CanvasTransform, false);
                panelDict.Add(type, instPanel.GetComponent<BasePanel>());

                return instPanel.GetComponent<BasePanel>();
            }

            return Panel1;
        }

        /// <summary>
        /// 显示某个面板UI
        /// </summary>
        /// <param name="type">UI的枚举类</param>
        public void PushPanel(EUIPanelType type)
        {
            if (panelStack == null)
                panelStack = new Stack<BasePanel>();

            BasePanel topPanel = null;
            BasePanel currPanel = null;

            if (panelStack.Count > 0)
                topPanel = panelStack.Peek();
            currPanel = GetPanel(type);
            panelStack.Push(currPanel);

            finishEvent = currPanel.OnEnter;

            if (topPanel != null)
                topPanel.OnPause(finishEvent);
            else
                currPanel.OnEnter();
        }

        /// <summary>
        /// 关闭最顶层UI面板
        /// </summary>
        public void PopPanel()
        {
            if (panelStack == null)
                panelStack = new Stack<BasePanel>();

            BasePanel topPanel = null;
            BasePanel currPanel = null;

            if (panelStack.Count == 0) return;
            topPanel = panelStack.Pop();

            finishEvent = null;
            if (panelStack.Count != 0)
            {
                currPanel = panelStack.Peek();
                finishEvent = currPanel.OnResume;
            }

            topPanel.OnExit(finishEvent);
        }

        /// <summary>
        /// 清空在显示的UI面板
        /// </summary>
        public void ClearPanel()
        {
            if (panelStack == null)
                return;
            if (panelStack.Count != 0)
                panelStack.Clear();
            if (panelDict.Count != 0)
                panelDict.Clear();
        }

        #endregion


    }
}

```

## UIPanelEnum

```Csharp
public enum EUIPanelType
{
    //TOADD:添加面板
    StartPanel
}
```

## UIPanel

```Csharp
public class UIPanel
{
    public EUIPanelType UIPanelType;
    public string UIPanelPath;

    public UIPanel(EUIPanelType Type, string Path)
    {
        UIPanelType = Type;
        UIPanelPath = Path;
    }
}
```

## BasePanel

```Csharp
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace UI
{
    /// <summary>
    /// 该类是所有UI面板的基类，想要更改显示效果可以在这里更改，这里是用原生CanvasGroup实现的基本功能
    /// </summary>
    public class BasePanel : MonoBehaviour
    {
        public GameObject firstSelectedOgj = null;
        protected CanvasGroup canvasGroup;
        protected Button CloseButton = null;

        protected virtual void Awake()
        {
            canvasGroup = GetComponent<CanvasGroup>();
            CloseButton = FindCloseButton("CloseButton");
            if (CloseButton != null)
            {
                CloseButton.onClick.AddListener(Close);
            }

            if (canvasGroup == null)
                canvasGroup = transform.gameObject.AddComponent<CanvasGroup>();
            canvasGroup.alpha = 0;
            canvasGroup.blocksRaycasts = false;
        }

        public virtual void OnEnter() //开始面板
        {
            EventSystem.current.firstSelectedGameObject = firstSelectedOgj;
            EventSystem.current.SetSelectedGameObject(null);
            EventSystem.current.SetSelectedGameObject(firstSelectedOgj);
            canvasGroup.alpha = 1;
            canvasGroup.blocksRaycasts = true;
        }

        public virtual void OnResume() //继续（当上层面板关闭时）
        {
            EventSystem.current.firstSelectedGameObject = firstSelectedOgj;
            EventSystem.current.SetSelectedGameObject(null);
            EventSystem.current.SetSelectedGameObject(firstSelectedOgj);
            canvasGroup.alpha = 1;
            canvasGroup.blocksRaycasts = true;
        }

        public virtual void OnPause(UnityAction finishEvent = null) //暂停（当有上层面板覆盖时）
        {
            canvasGroup.alpha = 0;
            canvasGroup.blocksRaycasts = false;

            if (finishEvent != null)
            {
                finishEvent();
            }
        }

        public virtual void OnExit(UnityAction finishEvent = null) //关闭面板
        {
            canvasGroup.alpha = 0;
            canvasGroup.blocksRaycasts = false;

            if (finishEvent != null)
            {
                finishEvent();
            }
        }

        private Button FindCloseButton(string childName)
        {
            Button closeButton = null;
            foreach (var item in GetComponentsInChildren<Button>())
            {
                if (item.name == childName)
                    closeButton = item.GetComponent<Button>();
            }

            return closeButton;
        }

        public virtual void Close()
        {
            UIManager.Instance.PopPanel();
        }
    }
}
```

## DictionaryExtension

```Csharp
using System.Collections.Generic;

public static class DictionaryExtension
{
    /// <summary>
    /// 扩展字典类中的TryGetValue方法
    /// 可以直接通过给出key返回value,而不是像原方法一样返回bool值
    /// </summary>
    /// <typeparam name="TKey"></typeparam>
    /// <typeparam name="TValue"></typeparam>
    /// <param name="dict"></param>
    /// <param name="key"></param>
    /// <returns></returns>

    public static TValue TryGetValue<TKey, TValue>(this Dictionary<TKey, TValue> dict, TKey key)
    {
        TValue value;
        dict.TryGetValue(key, out value);

        return value;
    }
}

```

## ListExtension

```Csharp
using System.Collections.Generic;

public static class ListExtension
{
    /// <summary>
    /// 扩展List类
    /// 查找字段是指定UIPanelType的UIPanel,返回UIPanel的引用
    /// </summary>
    /// <param name="list">UIPanel的List</param>
    /// <param name="type"></param>
    /// <returns></returns>
    /// 
    public static UIPanel SearchPanelForType(this List<UIPanel> list, EUIPanelType type)
    {
        if (list == null)return null;
        foreach (var item in list)
        {
            if (item.UIPanelType == type)
                return item;
        }
        return null;
    }
}
```

## Start

```Csharp
using UnityEngine;
using UI;

public class UIEnter : MonoBehaviour
{
    public void Start()
    {
        UIManager.Instance.ClearPanel();
        UIManager.Instance.PushPanel(EUIPanelType.StartPanel);
    }
}
```

## StartPanel

```Csharp
namespace UI
{
    public class StartPanel : BasePanel
    {
        public void OnStartGameButton()
        {
            //UIManager.Instance.PushPanel();
        }
    }
}
```


# SceneManger

接下来登场的是，我自己实际用的超精简SceneManger，属于是想用什么内容就加什么内容了哈哈

```Csharp
using System;
using System.Collections;
using System.Collections.Generic;
using UI;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Juanxcg
{
    public class SceneManger : MonoBehaviour
    {
        private bool _isActionOut = false;

        private static SceneManger _instance;

        public static SceneManger Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = GameObject.Find(nameof(SceneManger)).GetComponent<SceneManger>();
                }

                return _instance;
            }
        }

        public float loadingValue { get; private set; }

        //设置基本的场景切换后的方法(例如角色血条的加载等等)
        public Action onStartAction;


        public int GetSceneNumber
        {
            get { return SceneManager.GetActiveScene().buildIndex; }
        }

        //设置不销毁的物体
        public List<GameObject> objectsDontDestory;

        /// <summary>
        /// 设置不随场景切换而销毁的物体
        /// </summary>
        /// <param name="theobject"></param>
        /// <returns></returns>
        public List<GameObject> Push(GameObject theobject)
        {
            if (objectsDontDestory == null)
            {
                objectsDontDestory = new List<GameObject>();
            }

            objectsDontDestory.Add(theobject);

            return objectsDontDestory;
        }

        /// <summary>
        /// 选择要加载的场景
        /// </summary>s
        /// <param name="sceneIndex">场景的加载数字</param>
        public void MyLoadSceneAsync(int sceneIndex)
        {
            if (_isActionOut)
            {
                onStartAction = null;
                _isActionOut = false;
            }

            if (objectsDontDestory != null)
            {
                for (int i = 0; i < objectsDontDestory.Count; i++)
                {
                    DontDestroyOnLoad(objectsDontDestory[i]);
                }
            }

            DontDestroyOnLoad(this.gameObject);

            StartCoroutine(LoadAsync(sceneIndex));

            StartCoroutine(WaitForNewScene(sceneIndex));
        }

        //实现异步
        IEnumerator LoadAsync(int sceneIndex)
        {
            PushLoadPanel();
            AsyncOperation operation = SceneManager.LoadSceneAsync(sceneIndex); //获取场景

            while (!operation.isDone) //当场景没有加载完毕
            {
                loadingValue = operation.progress; //进度条与场景加载进度对应
                yield return null;
            }
        }

        IEnumerator WaitForNewScene(int sceneIndex)
        {
            while (SceneManager.GetActiveScene().buildIndex != sceneIndex) //当场景没有加载完毕
            {
                yield return null;
            }

            onStartAction?.Invoke();
            _isActionOut = true;
        }


        /// <summary>
        /// 通过名字删除某一个物体
        /// </summary>
        /// <param name="name"></param>
        public void DeleteDontGameObject(string name)
        {
            for (int i = 0; i < objectsDontDestory.Count; i++)
            {
                if (objectsDontDestory[i].name == name)
                {
                    objectsDontDestory.Remove(objectsDontDestory[i]);
                }
            }
        }


        /// <summary>
        /// 添加场景切换后的的逻辑
        /// </summary>
        /// <param name="action"></param>
        public void AddActionAfterScene(Action action)
        {
            if (_isActionOut)
            {
                onStartAction = null;
                _isActionOut = false;
            }

            onStartAction += action;
        }


        /// <summary>
        /// 清空
        /// </summary>
        public void Clear()
        {
            objectsDontDestory.Clear();
            onStartAction = null;
        }


        
        public void PushLoadPanel()
        {
            //放入面板的相关代码
        }
    }
}
```

这一点代码实现了基本的场景切换的部分功能。