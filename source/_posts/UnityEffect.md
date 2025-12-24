---
title: Unity细节效果实现
date: 4/22/2024
tags: Unity
categories: 学无止境
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/UnityEffect.jpg
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

# 可折叠与动态添加任务的任务栏

先看效果

![示例](https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/Idea.gif)

任务的模板是在Unity的滑动视图中的content操作。
先给Content物体添加Vertical Layout Group和Content Size Fitter组件来适应Idea的变化。

在下图中，Idea_Content是一个滑动视图，然后再Content中进行了任务的编写，符合人们的逻辑，Idea为整个分级任务，然后Idea_Content用来生成子任务。其中Idea和Idea_Content都有Vertical Layout Group组件，不添加Content Size Fitter组件的原因是因为如果两个相同的Content Size Fitter组件在父子级关系的物体上，就会出现计算异常的BUG，出现计算错误甚至报错的情况。

![层级](https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/%E6%8A%98%E5%8F%A0%E4%BB%BB%E5%8A%A1%E6%A0%8F%E7%9A%84%E5%B1%82%E7%BA%A7.png)


源码如下：
```csharp
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class Idea : MonoBehaviour
{
    private float time = 0;
    private float IdeaContentHeight; //子任务高度

    public MyState state;

    public Transform content_F;
    public List<GameObject> childObject;
    public GameObject IdeaPra; //子任务的预制体

    private void Start()
    {
        state = MyState.Selected;
        childObject = new List<GameObject>();
        IdeaContentHeight = IdeaPra.GetComponent<RectTransform>().sizeDelta.y;
    }

    private void Update()
    {
        if (time - 5 > 0)
        {
            time = 0;
            AddItemContent("建筑");
        }

        time += Time.deltaTime;
    }

   
    //折叠按钮的代码
    public void OnButtonDown()
    {
        if (state == MyState.Selected)
        {
            state = MyState.Unselected;
            foreach (var item in childObject)
            {
                item.SetActive(false);
                SetContentSize();
            }
        }
        else
        {
            state = MyState.Selected;
            foreach (var item in childObject)
            {
                item.SetActive(true);
                SetContentSize();
            }
        }
    }

    //加入新的子任务
    public void AddItemContent(string name)
    {
        if (content_F == null)
        {
            content_F = transform.GetChild(1);
        }

        GameObject idea = Instantiate<GameObject>(IdeaPra, content_F);
        idea.GetComponent<Text>().text = name;
        childObject.Add(idea);
        if (state == MyState.Unselected)
        {
            idea.SetActive(false);
        }

        SetContentSize();
    }


    //以下代码为动态更新高度来适应Vertical Layout Group和Content Size Fitter组件
    public void ChangeHeight(GameObject item, float height)
    {
        RectTransform rectTransform = item.GetComponent<RectTransform>();

        if (rectTransform != null)
        {
            rectTransform.sizeDelta = new Vector2(rectTransform.sizeDelta.x, height);
        }
    }

    public void SetContentSize()
    {
        if (state == MyState.Selected)
        {
            ChangeHeight(content_F.gameObject, childObject.Count * IdeaContentHeight);
            SetSize();
        }
        else
        {
            ChangeHeight(content_F.gameObject,0);
            SetSize();
        }
    }
    
    public void SetSize()
    {
        float height = 0;
        for (int i = 0; i < this.transform.childCount; i++)
        {
            RectTransform rectTransform = transform.GetChild(i).GetComponent<RectTransform>();

            if (rectTransform != null)
            {
                height += rectTransform.sizeDelta.y;
            }
        }

        ChangeHeight(this.gameObject, height);
    }
}
```

