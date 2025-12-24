---
title: Unity细节效果实现
date: 4/22/2024
tags: Unity
categories: 学无止境
top_img: /image/backGround.png
cover: /image/UnityEffect/UnityEffect.jpg
---

# 前言

用来记录一些unity的好看的效果实现哈哈，话不多说，开撸

# 流动虚线框

用四个LineRender来实现流动虚线框的效果，看起来很简单，但是如果没做过确实有点无从下手。

先看效果：

![1713796248375.gif](https://s2.loli.net/2024/04/22/ahZQOPDpxg9f3Il.gif)

首先准备一个

![虚线3 (1).png](https://s2.loli.net/2024/04/22/JAc3CdTs9aVtx84.png)

这样的一节的虚线png文件，然后创建一个这样的材质：

![屏幕截图 2024-04-22 222750.png](https://s2.loli.net/2024/04/22/bTNjiKtgULAHye2.png)


然后把材质设置成：

![屏幕截图 2024-04-22 224109.png](https://s2.loli.net/2024/04/22/JCs5kb2RM8BjrKW.png)
（注意贴图间的拼接模式）

要注意Shader的选择，然后把png拖进纹理中

然后按以下的图来完成布局：
![屏幕截图 2024-04-22 222843.png](https://s2.loli.net/2024/04/22/rJ8skbYMnQFhNi3.png)
![屏幕截图 2024-04-22 222855.png](https://s2.loli.net/2024/04/22/WMIZOkDQBoCmNlz.png)
![屏幕截图 2024-04-22 222809.png](https://s2.loli.net/2024/04/22/xtWJjRMYAnIbdUl.png)


最后把代码写进脚本

```csharp
using UnityEngine;

public class LineCtrler : MonoBehaviour
{
    [SerializeField] public LineRenderer lineRenderer1;
    [SerializeField] public LineRenderer lineRenderer2;
    [SerializeField] public LineRenderer lineRenderer3;
    [SerializeField] public LineRenderer lineRenderer4;
    private Material material1;
    private Material material2;
    private Material material3;
    private Material material4;
    private Vector2 tiling;
    private Vector2 offset;
    private int mainTexProperty;
    private float timer = 0;
    
    // 频率间隔
    [SerializeField]
    private float frequency = 0.03f;

    //流动速度
    [SerializeField]
    private float moveSpeed = 0.04f;
    
    void OnEnable()
    {
        // 缓存材质实例
        material1 = lineRenderer1.material;
        material2 = lineRenderer2.material;
        material3 = lineRenderer3.material;
        material4 = lineRenderer4.material;
        
        // 缓存属性id，防止下面设置属性的时候重复计算名字的哈希
        mainTexProperty = Shader.PropertyToID("_MainTex");

        offset = Vector2.zero;
    }

    private void Update()
    {
        timer += Time.deltaTime;
        if(timer >= frequency)
        {
            timer = 0;
            offset -= new Vector2(moveSpeed, 0);
            material1.SetTextureOffset(mainTexProperty, offset);
            material2.SetTextureOffset(mainTexProperty, offset);
            material3.SetTextureOffset(mainTexProperty, offset);
            material4.SetTextureOffset(mainTexProperty, offset);
        }
    }
}
```

然后把几个物体的linerender拖进脚本，就得到了一个简单的虚线流动框了！