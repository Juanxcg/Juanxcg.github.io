---
title: Unity基本框架
date: 4/6/2024
tags: Unity
categories: 学无止境
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/UnityMangerLearning.jpg
---
# 前述

总结的一些Unity的常用工具集

# UIS

这是我根据网上的一些框架自己总结写出的小框架，感觉比较好用。

## UIManager

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


# SceneManager

接下来登场的是，我自己实际用的超精简SceneManger，属于是想用什么内容就加什么内容了哈哈

```Csharp
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Manager
{
    public class MySceneManager : SingletonMono<MySceneManager>
    {
        //场景的加载进度条Value
        public float loadingValue { get; private set; }
        
        //加载进度条的Panel
        public GameObject LoadingPanel;

        //设置基本的场景切换后的方法(例如角色血条的加载等等)
        private Action onStartAction;
        
        //判断是否已经执行回调
        private bool _isActionOut = false;
        
        public int GetSceneNumber
        {
            get { return SceneManager.GetActiveScene().buildIndex; }
        }

        //设置不销毁的物体的List
        private List<GameObject> objectsDontDestory;

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
        /// 通过名字将一个物体从不可删除队列中移除
        /// </summary>
        /// <param name="name"></param>
        public void RemoveDontGameObject(string name)
        {
            for (int i = 0; i < objectsDontDestory.Count; i++)
            {
                if (objectsDontDestory[i].name == name)
                {
                    objectsDontDestory[i].transform.SetParent(null);
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
        /// 初始化
        /// </summary>
        public void Clear()
        {
            foreach (var bGameObject in objectsDontDestory)
            {
                bGameObject.transform.SetParent(null);
            }
            objectsDontDestory.Clear();
            onStartAction = null;
        }


        public void PushLoadPanel()
        {
            LoadingPanel.SetActive(true);
            //放入面板的相关代码
        }
    }
}
```

这一点代码实现了基本的场景切换的部分功能。

# MusicManager

这里是一个比较简单的全局音乐管理的实现代码

## Music

```Csharp
[System.Serializable]
public class Music
{
    public string name;
    public AudioClip clip;
    [Range(0f, 1f)] public float volume = 1f;
}
```
## MusicManager

```Csharp
public class MusicManager : MonoSingleton<MusicManager>
{
    public List<Music> musicSounds, sfxSounds;

    [SerializeField] private AudioSource musicSource, sfxSource;
    
    public float musicVolume => musicSource.volume;
    public float sfxVolume => sfxSource.volume;
    
    //播放音乐的方法，参数为音乐名称
    public void PlayMusic(string name)
    {
        //从音乐Sounds数组中找到名字匹配的Sound对象
        Music s = musicSounds.Find(x => x.name == name);
        //如果找不到对应的Sound，输出错误信息
        if (s == null)
        {
            Debug.Log("没有找到音乐");
        }
        //否则将音乐源的clip设置为对应Sound的clip并播放
        else
        {
            musicSource.clip = s.clip;
            musicSource.Play();
        }
    }

    //播放音效的方法，参数为音效名称
    public void PlaySFX(string name)
    {
        //从音效Sounds数组中找到名字匹配的Sound对象
        Music s = sfxSounds.Find(x => x.name == name);
        //如果找不到对应的Sound，输出错误信息
        if (s == null)
        {
            Debug.Log("没有找到音效");
        }
        //否则播放对应Sound的clip
        else
        {
            sfxSource.PlayOneShot(s.clip);
        }
    }

    //暂停音乐
    public void PauseMusic()
    {
        musicSource.Pause();
    }

    public void UnPauseMusic()
    {
        musicSource.UnPause();
    }

    //暂停音效
    public void StopSFX()
    {
        sfxSource.Stop();
    }

    //切换音乐的静音状态
    public void ToggleMusic()
    {
        musicSource.mute = !musicSource.mute;
    }

    //切换音效的静音状态
    public void ToggleSFX()
    {
        sfxSource.mute = !sfxSource.mute;
    }

    //设置音乐音量的方法，参数为音量值
    public void MusicVolume(int volume)
    {
        float V = volume / 10f;
        musicSource.volume = V;
    }

    //设置音效音量的方法，参数为音量值
    public void SFXVolume(int volume)
    {
        float V = volume / 10f;
        sfxSource.volume = V;
    }
}
```

# BuffManager

写了一个比较好用的BuffManager

## Buff

先写一个通用的Buff接口

```csharp
public interface IBuff
{
    public void OnBuffAdd();

    public void OnBuffUpdate();

    public void OnBuffRemove();
}
```
## BuffManager

然后就是主要的BuffManager代码

```csharp
    public class BuffsManager : SingletonMono<BuffsManager>
    {
        private List<IBuff> _buffs;

        #region 私有方法
        private IBuff Creat(Enums.Buff buff)
        {
            return buff switch
            {
                //这里写枚举转换成具体类
                //例如: Enums.Buff.egBuff => new egBuff(),
                _ => throw new ArgumentOutOfRangeException(nameof(buff), buff, null)
            };
        }
        
        private void AddBuff(IBuff buff)
        {
            _buffs.Add(buff);
            buff.OnBuffAdd();
        }

        private void RemoveBuff(IBuff buff)
        {
            if (_buffs.Contains(buff))
            {
                _buffs.Remove(buff);
                buff.OnBuffRemove();
            }
        }
        
        private void Update()
        {
            foreach (var buff in _buffs)
            {
                buff.OnBuffUpdate();
            }
        }
        
        #endregion

        public void AddBuff(Enums.Buff buff)
        {
            AddBuff(Creat(buff));
        }

        public void RemoveBuff(Enums.Buff buff)
        {
            RemoveBuff(Creat(buff));
        }

        public bool Contains(Enums.Buff buff)
        {
            return _buffs.Contains(Creat(buff));
        }
    }

```

# TimeManager

这里是我主要用到的计时器的用法，一般配合上面的buffmanager一起用。

## Timer

```csharp
    public class Timer
    {
        private float time;
        private float timer;
        private Action callback;
        private bool isRepeat;
        public float Time => timer;
        public Timer(float time, bool isRepeat, Action callback)
        {
            this.time = time;
            this.timer = time;
            this.callback = callback;
            this.isRepeat = isRepeat;
        }

        public void OnUpdate(float deltaTime)
        {
            timer -= deltaTime;
            if (timer <= 0)
            {
                if (isRepeat)
                {
                    callback?.Invoke();
                    timer = time + timer;
                }
                else
                {
                    callback?.Invoke();
                    TimeManager.Instance.ReleaseTimer(this);
                }
            }
        }

        public void Close(bool isInvoke = false)
        {
            if (isInvoke)
            {
                callback?.Invoke();
            }
            TimeManager.Instance.ReleaseTimer(this);
        }

        public void Reset()
        {
            timer = time;
        }
    }
```


## TimeManager

```csharp
    public class TimeManager : SingletonMono<TimeManager>
    {
        private List<Timer> timerList = new List<Timer>();
        
        // 单次计时器.
        public Timer AddTimer(float time, Action callback)
        {
            Timer timer = new Timer(time, false, callback);
            timerList.Add(timer);
            return timer;
        }
        
        // 循环计时器.
        public Timer AddRepeatTimer(float time, Action callback)
        {
            Timer timer = new Timer(time, true, callback);
            timerList.Add(timer);
            return timer;
        }
        
        public void ReleaseTimer(Timer timer)
        {
            timerList.Remove(timer);
        }

        private void Update()
        {
            for (int i = 0; i < timerList.Count; i++)
            {
                timerList[i].OnUpdate(Time.deltaTime);
            }
        }

        public void ClearAllTimer()
        {
            foreach (var timer in timerList)
            {
                timer?.Close();
            }
            
            timerList.Clear();
        }
    }
```