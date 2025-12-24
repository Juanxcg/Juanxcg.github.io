---
title: 手指跳舞模拟器————一款支持DIY的受苦游戏
date: 5/19/2024
tags: Unity
categories: 作品集
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/DancingFinger-%E5%B0%81%E9%9D%A2.jpg
---

# 作品基本介绍

![手指跳舞！](https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/DancingFinger-%E5%B0%81%E9%9D%A2.jpg)

> 分享链接: http://pan.dlut.edu.cn/share?id=ffmfkuu9dpz4
>
> 视频链接：https://www.bilibili.com/video/BV1NT421Q7EG/?spm_id_from=333.999.0.0&vd_source=21ef5dd001904577c706b7897134152a

这是一款可以支持自定义关卡即DIY的小游戏，由Unity制作，这里我会写一下相对重要的功能实现。

# 作品拆解

## DIY部分实现

首先是支持DIY的部分，这部分其实非常简单，只需要知道unity的streamingAsset文件夹在构建打包完作品之后里面的内容不会改变即可。实际原理就是在这个文件中做一个按照某项规则创建的文件，可供程序的关卡部分读取实现即可。

```Csharp
public class CSVReading : MonoBehaviour
{
    private void OnEnable()
    {
        string filePath = Path.Combine(Application.streamingAssetsPath, "mydata.csv");

        StreamReader _reader = new StreamReader(filePath);
        
        // 读取文件内容
        while (!_reader.EndOfStream)
        {
            string line = _reader.ReadLine();
            string[] strings = line.Split(',');

            // 处理每个格子的内容
            foreach (string cell in strings)
            {
                CSVKeys.Instance.keys.Add(cell);
            }
        }

        // 关闭文件
        _reader.Close();
        
        CSVKeys.Instance.StartFashingData();
    }
}
```

这里我写了一个CSV读取，至于为什么选择CSV，是相较于Excel更方便读取，而且可读性要比json要好一点，所以选择了CSV文件，然后用`CSVKeys`这一个单例类来储存每个数据。

## 游戏输入检测

这个游戏的输入检测可以说是比较重要的部分了。 这里我用一个哈希集合来实现每一帧的输入检测。便于之后的查找。（虽然感觉26个英文字母在各个数据类型的查找区别都不大）

```Csharp
    public class InputControl : MonoSingleton<InputControl>
    {
        //每一帧按下的键位（实时更改）
        public HashSet<KeyCode> pressedKeys = new HashSet<KeyCode>();

        private void FixedUpdate()
        {
            if (!GameManager.Instance.isPause)
            {
                pressedKeys.Clear(); // 清空，准备获取新的按键状态

                // 遍历所有可能的键
                foreach (KeyCode keyCode in System.Enum.GetValues(typeof(KeyCode)))
                {
                    // 只添加英文字母键
                    if (keyCode >= KeyCode.A && keyCode <= KeyCode.Z && Input.GetKey(keyCode))
                    {
                        pressedKeys.Add(keyCode);
                    }
                }
            }
        }
    }
```

## 核心游戏循环

这一段代码是关于游戏的核心上升和下降的代码，在主循环中按照关卡时间调用`GetLevelResult()`函数即可。

```Csharp
    public class LevelKeysManager : Singleton<LevelKeysManager>
    {
        //关卡状态
        ELevelState _eLevelState;

        //实际关卡数
        private int _level = 0;

        public int level => _level;

        public void ReStart()
        {
            _level = 0;
        }
        
        #region 关卡变化的逻辑

        //层数上升的逻辑
        private void LevelUp()
        {
            if (_level >= CSVKeys.Instance.GetKeysLength() - 1)
            {
                return;
            }

            _level++;
            //TODO 关卡上升逻辑

            UIManager.Instance.UpdateKeyUI(_level);
            GameScreen.Instance.ShowUpImage(_level);

            if (CSVKeys.Instance.GetData(EKeysEnums.isSafety, _level) == "1")
            {
                MusicManager.Instance.PlaySFX("Safe");
            }
            else
            {
                MusicManager.Instance.PlaySFX("Up");
            }
        }

        //层数不动的逻辑
        private void LevelStay()
        {
            //TODO 关卡不动逻辑
        }


        //层数下降的逻辑
        private void LevelDown()
        {
            if (_level == 0)
            {
                return;
            }
            
            while (CSVKeys.Instance.GetData(EKeysEnums.isSafety, _level - 1) == "1" && _level > 1)
            {
                _level--;
            }
            
            _level--;
            //TODO 关卡下降逻辑

            UIManager.Instance.UpdateKeyUI(_level);
            GameScreen.Instance.ShowDownImage(_level);

            MusicManager.Instance.PlaySFX("Down");
        }

        #endregion


        //关卡的内在逻辑
        public void GetLevelResult()
        {
            _eLevelState = ELevelState.Up;

            if (CSVKeys.Instance.GetData(EKeysEnums.Downlevelkeys, _level).Length ==
                InputControl.Instance.pressedKeys.Count)
            {
                foreach (var levelkey in CSVKeys.Instance.GetData(EKeysEnums.Downlevelkeys, _level))
                {
                    if (!InputControl.Instance.IsKeyPressed(levelkey))
                    {
                        _eLevelState = ELevelState.Stay;
                        break;
                    }
                }
            }
            else
            {
                _eLevelState = ELevelState.Stay;
            }

            if (CSVKeys.Instance.GetData(EKeysEnums.isSafety, _level) != "1")
            {
                foreach (var levelkey in CSVKeys.Instance.GetData(EKeysEnums.DontDownlevelkeys, _level))
                {
                    if (InputControl.Instance.IsKeyPressed(levelkey))
                    {
                        _eLevelState = ELevelState.Down;
                        break;
                    }
                }

                foreach (var levelkey in CSVKeys.Instance.GetData(EKeysEnums.DontUplevelkeys, _level))
                {
                    if (!InputControl.Instance.IsKeyPressed(levelkey))
                    {
                        _eLevelState = ELevelState.Down;
                        break;
                    }
                }
            }

            switch (_eLevelState)
            {
                case ELevelState.Up:
                    LevelUp();

                    break;
                case ELevelState.Down:
                    LevelDown();

                    break;
                case ELevelState.Stay:
                    LevelStay();
                    break;
            }
        }
    }
```

## 音乐管理

这里用到了一个非常简单的全局音效管理，只能说是比较粗糙：

首先用到一个Music的类（当然也可以用结构体）

```Csharp
[System.Serializable]
public class Music
{
    public string name;
    public AudioClip clip;
    [Range(0f, 1f)] public float volume = 1f;//也可以自己初始化就设置音乐大小，但是我这里没用到
}
```

然后根据这个Music来写一个MusicManager，在Unity中创建一个MusicManager的空物体和两个带着AudioSource的子物体用来实际播放音乐。

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

## 音乐可视化

这里就是属于一个装饰性的小代码段，主要是用LineRenderer来实现类似于音乐播放器的线跳动，但是可能很多人感兴趣，所以我写在这里：

```Csharp
public class AudioVisualizer : MonoBehaviour
{
    public AudioSource audioSource;
    public LineRenderer lineRenderer;

    [Header("相关参数")] 
    public int linepoint; //可视化点密度
    public float frushTime; //刷新频率
    private float _timeCount;
    public float amplitudeMultiplier = 30f; //振幅放大倍数
    public float length = 6; //Line的长度
    public int nullPoint; //前后空置的点数


    private List<float> _x;
    private List<float> _y;
    
    private void Start()
    {
        _x = new List<float>();
        _y = new List<float>();
    }

    void Update()
    {
        _timeCount -= Time.deltaTime;

        if (_timeCount <= 0)
        {
            float[] spectrumData = new float[256]; // 或者其他大小
            audioSource.GetSpectrumData(spectrumData, 0, FFTWindow.BlackmanHarris);
            // 绘制频谱图
            lineRenderer.positionCount = linepoint;

            for (int i = 0; i < linepoint; i++)
            {
                _x.Add((float)i / linepoint * length);
            }

            for (int i = 0; i < linepoint; i++)
            {
                if (i < nullPoint || i >= linepoint - nullPoint)
               {
                    _y.Add(0f);
                }
                else
                {
                    _y.Add(spectrumData[i - nullPoint] * amplitudeMultiplier); // 调整振幅
                }
            }

            for (int i = 0; i < linepoint; i++)
            {
                lineRenderer.SetPosition(i, new Vector3(_x[i], _y[i], 0));
            }

            _timeCount = frushTime;
            _x.Clear();
            _y.Clear();
        }
    }
}
```

