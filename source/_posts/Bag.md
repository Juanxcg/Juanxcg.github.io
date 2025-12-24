---
title: 关于背包问题的相关思考
date: 10/11/2024
tags: 算法
categories: 学无止境
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/Bag.jpg
---

# 前述

这里写一点我对最近写到的背包算法的想法，觉得比较巧妙所有就准备写在博客里

这里推荐几个比较好的博客和视频，学到了很多东西

**CSDN**
> [01背包和完全背包](https://blog.csdn.net/txyyt_wst/article/details/130206572)
> [算法之动态规划](https://blog.csdn.net/PRML_MAN/article/details/114433408)

**BiliBili**
> [【动态规划】背包问题](https://www.bilibili.com/video/BV1K4411X766?buvid=XU9FDE3953B29E95AF647C103EDD9774D488F&from_spmid=main.my-history.0.0&is_story_h5=false&mid=Z0nhgIRuzpdypZaVNvyyTQ%3D%3D&plat_id=116&share_from=ugc&share_medium=android&share_plat=android&share_session_id=c00c321f-7c69-4441-8845-cba3e03284a7&share_source=WEIXIN&share_tag=s_i&spmid=united.player-video-detail.0.0&timestamp=1731219525&unique_k=Fhh2XBA&up_id=4416409&share_source=weixin)

# 基础0-1背包

## 问题描述

对于一堆物体，每个物体就只有一个，每个物体有它的体积与价值，问一个体积有限的背包怎么能够拿到价值最高的物体

## 问题分析

其实本质上还是动态规划问题，我们假设有一个二维数组`dp[i][j]`，其中的`i`对应在只考虑前i个物体的情况，其中的`j`可以抽象理解成考虑前j个背包每个单位体积，那么对应的值就是在只考虑前i个物体，考虑前j个背包的体积的最大价值。这么一说，那么这个问题就简单了，只需要每次更新要不要加入这个物体就好了。这么说肯定很抽象，那么我们来举个例子。

假如有一堆物体，将它们放到一个容量为10的背包中，物体的相关属性如下：

| 物品编号 | 体积 | 价值 |
| :---: | :-----:  | :------:  |
|0|2|3|
|1|3|4|
|2|4|4|
|3|6|6|

那么就会有这么一个算法过程：

| i\j | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-----|---|---|---|---|---|---|---|---|---|---|----|
| 0   | 0 | 0 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |  3 |
| 1   | 0 | 0 | 3 | 4 | 4 | 7 | 7 | 7 | 7 | 7 |  7 |
| 2   | 0 | 0 | 3 | 4 | 4 | 7 | 7 | 7 | 7 |11 | 11 |
| 3   | 0 | 0 | 3 | 4 | 4 | 7 | 7 | 7 | 7 |11 | 11 |


## 核心代码

```cpp
for(int i=1;i<m;i++)
{
	for(int j=1;j<=n;j++)
	{
		if(j>=w[i]) 
        {
            dp[i][j]=max(dp[i-1][j],dp[i-1][j-w[i]]+v[i]);
        }
		else
        {
            dp[i][j]=dp[i-1][j];
        }
	}
}
```

## 代码优化

可以看出这个代码的空间复杂度是***O***(i+j)，但是我们观察可以看到，每次循环我们只会用到上一层的价值行，所有可以在这个步骤上下功夫缩减成一维数组。直接放出结果：
```cpp
for(int i=0;i<m;i++)
{
	for(int j=n;j>=w[i];j--)
    {
        dp[j]=max((dp[j],dp[j]-w[i])+v[i]);
	}
}
```

这里可以看到内置循环是从右往左，这个顺序不能改变，因为如果改变就会直接改变后面的结果，导致之前的数据丢失，所以不能改变。

# 完全背包

## 问题描述

对于一堆物体，每个物体有无数个，每个物体有它的体积与价值，问一个体积有限的背包怎么能够拿到价值最高的物体。

## 问题分析

其实就是0-1背包变得可以覆写数据了，根据上面优化之后的代码，我们可以直接变成正向循环，让他变得可以直接覆写，这样就实现了动态改变放入的物品数量。当然也可以从二维数组开始写，因为我们不知道到底放入几个相同物体，那么就需要再加一层循环。这里我也贴出了代码，但是建议直接去看优化后的代码。

## 核心代码

```cpp
for (int i = 1; i <= n; i ++ ){
    for (int j = 1; j <= m; j ++ ) {
        dp[i][j] = dp[i - 1][j]; 
        if (v[i] > j) {  // 防止数组越界
            continue;
        }
        for (int k = 0; k * v[i] <= j; k++) { // 添加k个物品i
            dp[i][j] = max(dp[i][j], dp[i - 1][j - k * v[i]] + k * w[i]);
        }
    }
}
```

## 代码优化

```cpp
for(int i=0;i<m;i++)
{
	for(int j=w[i];j<=n;j++)
	{
        dp[j]=max(dp[j],dp[j-w[i]]+v[i]);
	}
}
```