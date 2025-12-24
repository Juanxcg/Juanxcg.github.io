---
title: 学习FSM有限状态机有感
data: 3/8/2024
tags: FSM有限状态机
categories: 学无止境
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/FSM-Learning.jpg
---
学到了凉鞋大佬的FSM简易写法。

今天在编写2024CUSGA的作品的时候，用到了刚学到的FSM状态机的新的写法，很简单，但是也算是五脏俱全了。
```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using Unity.VisualScripting;
using UnityEngine;

//FSM要实现的接口
public interface IState
{
    void Enter();
    void Update();
    void FixedUpdate();
    void Exit();
}

//FSM获取方法的方法
public class CustomState : IState
{
    private Action mOnEnter;
    private Action mOnUpdate;
    private Action mOnFixedUpdate;
    private Action mOnExit;
    public CustomState OnEnter(Action OnEnter)
    {
        mOnEnter = OnEnter;
        return this;
    }
    
    public CustomState OnUpdate(Action OnUpdate)
    {
        mOnUpdate = OnUpdate;
        return this;
    }

    public CustomState OnFixedUpdate(Action OnFixedUpdate)
    {
        mOnFixedUpdate = OnFixedUpdate;
        return this;
    }

    public CustomState OnExit(Action OnExit)
    {
        mOnExit = OnExit;
        return this;
    }

    public void Enter()
    {
        mOnEnter?.Invoke();
    }
    public void Update()
    {
        mOnUpdate?.Invoke();
    }
    public void FixedUpdate()
    {
        mOnFixedUpdate?.Invoke();
    }
    public void Exit()
    {
        mOnExit?.Invoke();
    }

}


public class FSM<T>
{
    //获取对象的各种状态（一般是枚举类型）
    public Dictionary<T,IState> mStates = new Dictionary<T,IState>();

    //填各种状态的OnEnter等等
    public CustomState State(T t)
    {
        if (mStates.ContainsKey(t))
        {
            return mStates[t] as CustomState;
        }

        var state = new CustomState();

        mStates.Add(t, state);

        return state;
    }


    private IState mCurrentState;
    private T mCurrentStateId;

    public IState CurrentState => mCurrentState;
    public T CurrentStateId => mCurrentStateId;

    //改变状态
    public void ChangeState(T t)
    {
        if(mStates.TryGetValue(t, out var state))
        {
            if(mCurrentState != null)
            {
                mCurrentState.Exit();
                mCurrentState = state;
                mCurrentStateId = t;
                mCurrentState.Enter();
            }
        }
    }

    //开始的状态
    public void StartState(T t)
    {
        if(mStates.TryGetValue(t,out var state))
        {
            mCurrentState = state;
            mCurrentStateId = t;
            state.Enter();
        }
    }

    //直接在对象的FixedUpdate或者Update中使用
    public void FixedUpdate()
    {
        mCurrentState?.FixedUpdate();
    }

    public void Update()
    {
        mCurrentState?.Update();
    }

    //在函数的Destory的时候调用
    public void Clear()
    {
        mCurrentState = null;
        mCurrentStateId = default;
        mStates.Clear();
    }
}


/// <summary>
/// 实例用法，写在脚本的Awake里
/// </summary>
public class StateExample
{
    public enum States
    {
        A,
        B,
        C
    }

    void Example()
    {
        var fsm=new FSM<States>();
        fsm.State(States.A)
            .OnEnter(() =>
            {
                //ToDO
            })
            .OnUpdate(() =>
            {
                //ToDO
            })
            .OnFixedUpdate(() =>
            {
                //ToDO
            })
            .OnExit(() =>
            {
                //ToDO
            });

        fsm.StartState(States.A);
        fsm.ChangeState(States.B);
    }
}
```

也能处理物理层面的改变，毕竟是有FixedUpdate在的。

在使用了两天之后，我发现这个FSM的写法确实非常的清楚，能够看出每个代码的使用结果。就好像我在写的实例程序一样，只要在程序的开头写上这么一段就能获取到整个状态的变化，虽然看着比较多，但是代码辨识度很高。

其实每一个FSM的写法重点都在于怎么把方法传进状态机，并且调用起来非常简单，除了这一种写法之外，还有一种写法是在各个函数的的构造函数中传入FSM,当时相比于那种方式，这种方式的泛型很明显更加自由，我会在下一篇博客写到另一个状态机的写法。