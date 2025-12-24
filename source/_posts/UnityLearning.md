---
title: Unity实用代码技巧
date: 4/6/2024
tags: Unity
categories: 学无止境
top_img: /image/backGround.png
cover: /image/UnityLearning/UnityLearning.jpg
---
# 前述

总结的一些Unity使用的小技巧

# 2D
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