---
title: 算法学习(cpp)
date: 3/25/2024
tags: 算法
categories: 学无止境
top_img: /image/backGround.png
cover: /image/CppLearning/CppLearning.jpg
---

# 前述
最近要准备笔试，所以对之前学过的算法都复习一遍（可恶，手都已经生了），连最基本的链表反转都要想好一会，最近都会在这个博客上更新这些内容，应该会分类每一个题目的范围，也算是对自己的一个鞭策吧。

同时本文的所有的算法均是出自LeetCode且是由C++编写的，所以酌情观看。

# 链表

链表可以说是C++比较独特的算法题目了，当然是先温习这个部分。

## 链表反转

### easy

>LeetCode题目:https://leetcode.cn/problems/reverse-linked-list/description/

这道题目可以说是非常的经典了，而它的实现方法也有很多种。首先是最常见的用三个指针来进行操作：

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode *p,*q,*r;
        p = head;
        q = nullptr;
        while(p!=nullptr){
            r=q;
            q=p;
            p=p->next;
            q->next=r;
        }
        return q;
    }
}
```

这是比较好的一种方法，当然我认为关于链表反转的问题大概都是可以用栈来解决的。（指用栈作为中转来反转）

还有一种力扣的官方的递归方法，我一开始并没有考虑到用递归的方法，如下：

```cpp
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        if (!head || !head->next) {
            return head;
        }
        ListNode* newHead = reverseList(head->next);
        head->next->next = head;
        head->next = nullptr;
        return newHead;
    }
};
```

这个方法的空间复杂度比较高，所以实际的问题解决中，最好不要用递归的方法。

### middle

在之后是一道中等难度的链表反转，相当于上述的链表再加上一些不确定条件

>力扣链接：https://leetcode.cn/problems/reverse-linked-list-ii/

这道题目我刚开始做的时候完全没想到用虚拟头节点这种方法，反而我是多次判断来做（这就可以看出我薄弱的基础），结果最终结果一共跑了4ms（而且非常屎），也是服了，这里写出比较好的方法：

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseBetween(ListNode* head, int left, int right) {
        ListNode *dummy=new ListNode(-1);
        dummy->next=head;
        ListNode * term=dummy;
        for(int i=0;i<left-1;++i){
            term=term->next;
        }
        ListNode *cur=term->next;
        ListNode *next;
        for(int i=0;i<right-left;++i){
            next=cur->next;
            cur->next=next->next;
            next->next=term->next;
            term->next=next;
        }
        return dummy->next;
    }
};
```
这是一个大佬的解法，精髓都在第二个for循环里，我也是想了好久（额，可能我比较菜）。大概就是确定反转的第一个和最后一个，然后把中间的链接也反置，算法思想是真的强。


## 查找链表是否有环

这是一个比较经典的问题，并且之前我在游戏制作中还用到了这个算法思想，还是很有用的：

### easy

>力扣链接：https://leetcode.cn/problems/linked-list-cycle/description/

对于这个题目，最常见的方法就是用快慢指针，这是个听起来很高级但是其实很简单的算法（其实更像是一种思想），之后在寻找链表中值的时候也可以用到。

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    bool hasCycle(ListNode *head) {
        if(head==NULL)
        return false;

        if(head->next==NULL)
        return false;

        ListNode *p,*q;
        p=head->next;
        q=head;
        while(p!=q){
            if(p==NULL||p->next==NULL){
                return false;
            }
            p=p->next->next;
            q=q->next;
        }
        return true;
    }
};
```

总体来说就是用一个快点的指针在前面“探路”，然后一个慢的指针在后面跟着，直到快慢指针相遇，就证明有环。如果要确定环的节点个数就让他们继续跑，到第二次相遇要经历循环的次数就是环的节点数目（长度）。

### middle

>力扣链接：https://leetcode.cn/problems/c32eOV/description/

看到这个题目我第一个想起来的方法是用哈希表来完成，但是我看到进阶中是用O(1)的空间来完成，就想到了快慢指针，我第一开始是想用统计环的长度然后用总体长度减去来获得指定节点，但是我发现没办法轻易得到循环链表的长度，所以就想着能不能快速得到指定节点，但是还是没有思路，只能用`unordered_set`先实现一遍：

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
#include<set>

class Solution {
public:
    ListNode *detectCycle(ListNode *head) {
        unordered_set<ListNode*> mySet;
        while(head!=NULL){
            if(mySet.count(head)){
                return head;
            }

            mySet.insert(head);
            head = head->next;
        }

        return NULL;
    }
};
```

这是用哈希表实现的思路，之后我去看题解，发现果然是有快慢指针的解法，而且是我从来都没有想过的形式，这种数学推导的过程真是令人愉悦啊，知识又扩充了：

```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode *detectCycle(ListNode *head) {
        if(head==NULL||head->next==NULL){
            return NULL;
        }

        ListNode *fast,*slow;
        fast = head;
        slow = head;
        while(fast!=NULL){
            slow = slow->next;
            if(fast ->next ==NULL)
            return NULL;
            fast = fast->next->next;
            if(fast == slow){
                fast = head;
                while(fast != slow){
                    fast = fast->next;
                    slow = slow->next;
                }
                return fast;
            }
        }

        return NULL;
    }
};

```

这就相当于用了一次快慢指针，然后又补充了一个双指针，很棒的解法！



