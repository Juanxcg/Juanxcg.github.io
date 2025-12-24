---
title: Unity实用代码技巧
date: 4/6/2024
tags: Unity
categories: 学无止境
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/UnityLearning.jpg
---
# 前述

总结的一些Unity使用的小技巧

# 2D
## 关于物体的转向问题

```csharp
    public void FilpTo(Transform target)
    {
        if(target != null)
        {
            Vector3 pos = transform.localScale;
            if (target.position.x < transform.position.x)
            {
                transform.localScale=new Vector3(-1,pos.y,pos.z);
            }
            else
            {
                transform.localScale = new Vector3(1,pos.y,pos.z);
            }
        }
    }
```

## 关于人物的碰撞检测

相关检测图层的方法：

```csharp
public static class LayerMaskUtility
{
    public static bool Contains(LayerMask layerMask, int layer)
    {
       return (layerMask & (1 << layer)) > 0;
    }
}
```

返回一个Bool类型的值，可以检测某图层是不是在指定的图层内。

示例：

```csharp
[ReadOnly] public bool isTrigger = false;

public LayerMask layerMask;

public event Action OnTriggerEnter;

private void OnTriggerEnter2D(Collider2D other)
{
    if (LayerMaskUtility.Contains(layerMask, other.gameObject.layer))
    {
        isTrigger = true;
        OnTriggerEnter?.Invoke();
    }
}
```

## 关于单例模式的简洁写法

### 普通类

```Csharp
public class SampleClass
{
    private static SampleClass _instance

    public static Instance{
        get{
            if(_instance==null){
                _instance = new SampleClass();
            }
            return _instance;
        }
    }

    //TODO
}
```


### 继承Mono的类

关于继承Mono类为什么不同可以参考官方文档：

> https://discussions.unity.com/t/nullreferenceexception-on-startcoroutine/110322

MonoBehaviour脚本不能独自存在，必须依附于某个GameObject

```Csharp
public class SampleClass : MonoBehaviour
{
    private static SampleClass _instance

    public static Instance{
        get{
            if(_instance==null){
                //因为Mono类必须要挂载在物体才能获取，不然会报空引用错误
                _instance = GameObject.Find("SampleClass").GetComponent<SampleClass>();
            }
            return _instance;
        }
    }

    //TODO
}
```

以上是一个非常简洁但是不严谨的方法，如果要是严谨的方法在下面这一种：

```csharp
using System;
using UnityEngine;

namespace Tools
{
    public abstract class MonoSingleton<T> : MonoBehaviour where T: MonoSingleton<T>
    {
        protected virtual bool IsDestroyOnLoad => true;
        
        private static T _instance;

        public static T Instance
        {
            get
            {
                if (!Application.isPlaying)
                    return null;
                
                if (_instance == null)
                    _instance = FindObjectOfType<T>();
                if (_instance == null)
                {
                    GameObject go = new(typeof(T).Name);
                    // 此处添加了 monobehaviour 脚本之后会跑一下脚本的生命周期
                    _instance = go.AddComponent<T>();
                }
                
                return _instance;
            }
        }

        private void OnSingletonInit()
        {
            transform.SetParent(null);
            if (!IsDestroyOnLoad)
                DontDestroyOnLoad(gameObject);
            OnInit();
        }

        private void Awake()
        {
            if (_instance == null)
            {
                _instance = this as T;
                _instance.OnSingletonInit();
                return;
            }

            if (_instance != this)
                DestroyImmediate(gameObject);
        }

        private void OnDestroy()
        {
            if (_instance == this)
            {
                _instance.OnUnInit();
                _instance = null;
            }
        }

        private void OnApplicationQuit()
        {
            if (_instance == this)
            {
                _instance.OnUnInit();
                _instance = null;
            }
        }

        protected virtual void OnInit()
        {
            
        }

        protected virtual void OnUnInit()
        {
            
        }
        
#if UNITY_EDITOR
        // 因为在 unity2019.3 之后，可以选择性开启 重置所有脚本的状态，因此需要显示重置一下
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSplashScreen)]
        private static void ResetStatic()
        {
            _instance = null;
        }
#endif
    }
}

```


## 关于角色基本移动的两种思路

### 使用Rigidbody2D的速度来进行移动

这种情况就属于用unity的Rigidbody2D组件来处理物理模拟：

```CSharp

using UnityEngine;

public class MoveRigidbody : MonoBehaviour
{
    public float speed;
    private Rigidbody2D _rb;

    void Start()
    {
        _rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        float moveHorizontal = Input.GetAxis("Horizontal");

        Vector2 movement = new Vector2(moveHorizontal, _rb.velocity.y);

        _rb.velocity = movement * speed;
    }
}
```

### 使用Transform的移动

如果你不需要物理模拟（例如，在平台游戏中，你通常使用Rigidbody2D来处理跳跃和碰撞，但是使用Transform来移动角色），你可以直接修改Transform的位置。

```Csharp
using UnityEngine;

public class MoveTransform : MonoBehaviour
{
    public float speed = 5.0f;

    void Update()
    {
        float moveHorizontal = Input.GetAxis("Horizontal");

        Vector3 movement = new Vector3(moveHorizontal, moveVertical, 0.0f);
        transform.position += movement * speed * Time.deltaTime;
    }
}
```


## 关于鼠标选中某物体或者UI的操作

Unity拖拽的基本原理：射线检测，鼠标位置增量转换为统一空间的位置增量，将位置增量添加到拖拽物体原位置上。

### UGUI

对于UI层面的东西可以直接使用`IPointerEnterHandler`，`IPointerMoveHandler`，` IPointerExitHandler`这三个接口来实现鼠标位置进入UI，在UI里移动和在离开UI的方法。

下面展示一个关于这方面的应用，就是一个简单的跟随鼠标的提示框:

```csharp
using UnityEngine;
using UnityEngine.EventSystems;

namespace UI.TipTool
{
    public class TipTool : MonoBehaviour, IPointerEnterHandler,IPointerMoveHandler, IPointerExitHandler
    {
        public GameObject tiptool;

        public void OnPointerEnter(PointerEventData eventData)
        {
            tiptool.transform.position = Input.mousePosition;
            tiptool.SetActive(true);
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            tiptool.SetActive(false);
        }

        public void OnPointerMove(PointerEventData eventData)
        {
            tiptool.transform.position = Input.mousePosition;
        }
    }
}
```

而要实现拖拽的相关代码，则要依赖`IDragHandler`, `IBeginDragHandler`, `IEndDragHandler`这三个接口来实现。

下面展示相关代码：

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
public class DragUI : MonoBehaviour, IDragHandler, IBeginDragHandler, IEndDragHandler
{
    private Vector3 offset;     //存储按下鼠标时的图片-鼠标位置差
    private Vector3 arragedPos; //保存经过整理后的向量，用于图片移动   
    
    /// <summary>
    /// 开始拖拽起始
    /// </summary>
    public void OnBeginDrag(PointerEventData eventData)
    {
        if (RectTransformUtility.ScreenPointToWorldPointInRectangle(transform.GetComponent<RectTransform>(), Input.mousePosition
     , eventData.enterEventCamera, out arragedPos))
        {
            offset = transform.position - arragedPos;
        }
    }
    
    /// <summary>
    /// 拖拽中
    /// </summary>  
    public void OnDrag(PointerEventData eventData)
    {
        transform.position = offset + Input.mousePosition;
    }
    
    /// <summary>
    /// 拖拽结束
    /// </summary>
    public void OnEndDrag(PointerEventData eventData)
    {
        transform.position = transform.parent.transform.position;
    }
}

```

使用条件：

1.场景中要有EventSystem

2.脚本引用命名空间using UnityEngine.EventSystems;

3.脚本继承自MonoBehaviour

4.脚本要实现接口IBeginDragHandler,IDragHandler,IEndDragHandler（第三个接口不是必须的）

5.仅对UGUI有效，ui的image组件的RaycastTarget必须勾选上


### 不涉及Canvas的物体

#### Unity固有方法

而对于不是UI的GameObject我们则不可以用上面的接口来实现了，我们需要通过碰撞体和Unity实现的方法来实现，具体方法是`OnMouseDown`,`OnMouseDrag`,`OnMouseUp`这三个方法，分别是鼠标在某碰撞体上按下，拖拽和松开的方法

```Csharp
using UnityEngine;

public class Test1 : MonoBehaviour
{
    //偏移量
    private Vector3 offset = Vector3.zero;
    private float z;
    private void OnMouseDown()
    {
        z = Vector3.Dot(transform.position - Camera.main.transform.position, Camera.main.transform.forward);    //也可以是z= Camera.main.WorldToScreenPoint(transform.position).z;

        //保持鼠标的屏幕坐标的z值与被拖拽物体的屏幕坐标的z保持一致
        Vector3 v3 = new Vector3(Input.mousePosition.x, Input.mousePosition.y, z);

        //得到鼠标点击位置与物体中心位置的差值
        offset = transform.position - Camera.main.ScreenToWorldPoint(v3);
    }
    private void OnMouseDrag()
    {
        //时刻保持鼠标的屏幕坐标的z值与被拖拽物体的屏幕坐标保持一致
        Vector3 v3 = new Vector3(Input.mousePosition.x, Input.mousePosition.y, z);

        //鼠标的屏幕坐标转换为世界坐标+偏移量=物体的位置
        transform.position = Camera.main.ScreenToWorldPoint(v3) + offset;
    }

}

```

>注意这个物体要有碰撞体才能实现。

#### 射线检测

这个是自己调用Physics2D的方法

```Csharp
using UnityEngine;
using UnityEngine.UI;

public class TipTool : MonoBehaviour
{
    public Text tiptext;
    private Vector2 mousePosition;
    private Collider2D collider;
    private Collider2D preColloder;

    private void Update()
    {
        // 获取鼠标位置
        mousePosition = Camera.main.ScreenToWorldPoint(Input.mousePosition);

        // 检测鼠标位置是否与2D碰撞器相交
        collider = Physics2D.OverlapPoint(mousePosition);

        if (collider == preColloder)
        {
            return;
        }

        // 如果与2D碰撞器相交，说明鼠标在该GameObject上
        if (collider != null && collider.gameObject == gameObject)
        {
            preColloder = collider;
            tiptext.text = gameObject.GetComponent<Card>().Comment;
        }
    }
}
```

Physics2D.OverlapPoint这个方法如果有多个碰撞体与该点重叠，则返回 Z 坐标值最小的碰撞体。如果该点上没有任何碰撞体，则返回 Null。

下面这个网址是方法描述

>https://docs.unity3d.com/cn/2019.4/ScriptReference/Physics2D.OverlapPoint.html

也可以用Physics2D.Raycast来检测
