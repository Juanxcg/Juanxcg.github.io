---
title: 学习FSM有限状态机有感（二）
data: 3/13/2024
tags: FSM有限状态机
categories: 学无止境
top_img: /image/backGround.png
cover: /image/FSM-Learning/FSM-Learning2.jpg
---
这里有我对于FSM的第二种理解的写法，也是我第一次参加GameJam的懵懵懂懂的用法，首先这个FSM的中心是在一个FSM的代码中，而不是用泛型扩散到其他的代码中。也就是说，你每一个物体使用状态机就要重写一遍FSM来具体应用这个FSM。

先创建一个接口，用来给每一个状态限制，同时方便状态机来用字典存放每一个状态的切换
```csharp
public interface IState
{
    void OnEnter();
    void OnUpdate();
    void OnFixedUpdate();
    void OnExit();
}
```

创建一个枚举类型用来存放每一个所选对象需要的各种类型
```csharp
public enum StateType
{
    A,
    B,
    C
}
```

然后就要开始写FSM的主体代码
```csharp
public class FSM : MonoBehaviour
{
    private IState currentState;
    
    private Dictionary<StateType,IState> states = new Dictionary<StateType,IState>();

    void Start()
    {
        states.Add(StateType.A, new A(this));
        states.Add(StateType.B, new B(this));
        states.Add(StateType.C, new C(this));

        TransitionState(StateType.A);
    }

    void Update()
    {
        currentState.OnUpdate();
    }

    void FixedUpdate()
    {
        currentState.OnFixedUpdate();
    }

    public void TransitionState(StateType type)
    {
        if (currentState != null)
            currentState.OnExit();
        currentState = states[type];
        currentState.OnEnter();
    }
}
```
在上面的`Start`方法中，很明显的有这么三行
```csharp
states.Add(StateType.A, new A(this));
states.Add(StateType.B, new B(this)); 
states.Add(StateType.C, new C(this));
```
这就是与上一个FSM写法的最大的区别，就是中心化。

下面对其中一种状态进行定义

```csharp
public class A : IState
{
    private FSM manager;

    public IdleState(FSM manager)
    {
        this.manager = manager;
    }
    public void OnEnter()
    {
        //TODO
    }

    public void OnUpdate()
    {
        //TODO
    }

    public void OnFixedUpdate()
    {
        //TODO
    }

    public void OnExit()
    {
        //TODO
    }
}

```

写到这里，你们肯定都豁然开朗了，在这里面是直接把FSM当作中心，用状态的构造函数来获取FSM脚本的具体方法。然后把状态的切换都写在其他的类中，改变FSM的`currentState`来实现状态的切换。

这个写法中，FSM中可以写很多各个状态通用的方法，并且可以用在其他的状态中。这种写法的优点就是代码分散在很多脚本中，每一个状态都可以写一个单独的脚本，但是缺点也很明显，每次写一种新的状态机就要重写一次FSM，比较适合大的项目，状态机的数量少但是状态很多的工程中。