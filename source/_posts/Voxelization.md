---
title: 用Unity实现三维obj文件的体素化
date: 6/23/2024
tags: Unity
categories: 学无止境
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/Voxelization.jpg
---

# 前言

使用unity完成了obj的简单体素化，可以自定义体素精度。

# 效果示例

![兔子](https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/20240623154718.png)

![AK47](https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/20240623154744.png)

算法的大体思路就是把模型缩小到自己设置的体素网格坐标系下，然后计算出每个三角网格面的包围盒，把每个包围盒与自己体素网格相比较，根据值来计算是否应该在这个体素格中生成体素，设置三维bool数组来标记生成的位置。

源码示例：
```csharp
using UnityEngine;
using System.IO;
using System.Collections.Generic;
using UnityEngine.UI;

public class VoxelizeOBJ : MonoBehaviour
{
    public string fileName; // OBJ文件名
    public int voxelResolution = 32; // 体素分辨率
    public GameObject cubePrefab;

    public GameObject Creat;

    public InputField name;
    public InputField pixel;
    public Button confire;


    void Start()
    {
        confire.onClick.AddListener(GetNameV);
        VoxelizeOBJFile();
    }

    void VoxelizeOBJFile()
    {
        name.text = fileName;
        pixel.text = voxelResolution.ToString();
        // 获取 StreamingAssets 文件夹路径
        string streamingAssetsPath = Application.streamingAssetsPath;

        // 获取 StreamingAssets 文件夹中的所有文件
        string[] files = Directory.GetFiles(streamingAssetsPath);
        string firstFile;

        if (files.Length > 0)
        {
            if (fileName != "")
                firstFile = Path.Combine(streamingAssetsPath, fileName);
            else
            {
                firstFile = files[0];
                name.text = files[0].Replace(streamingAssetsPath + "\\", "");
            }
        }
        else
        {
            return;
        }

        // 读取.obj文件的内容
        string[] lines = File.ReadAllLines(firstFile);

        // 存储顶点数据和面数据
        List<Vector3> vertices = new List<Vector3>();
        List<int[]> faces = new List<int[]>();

        // 解析文件数据
        foreach (string line in lines)
        {
            string[] parts = line.Split(' ');

            if (parts[0] == "v")
            {
                ParseVector(vertices, parts);
            }
            else if (parts[0] == "f")
            {
                ParseFace(faces, parts);
            }
        }

        // 进行体素化
        bool[,,] voxelGrid = Voxelize(vertices, faces);

        // 根据需要进行后续操作，比如可视化或保存体素化结果
        InstantiateCubes(voxelGrid);
    }

    void ParseVector(List<Vector3> list, string[] parts)
    {
        float x = float.Parse(parts[1]);
        float y = float.Parse(parts[2]);
        float z = float.Parse(parts[3]);
        list.Add(new Vector3(x, y, z));
    }

    void ParseFace(List<int[]> list, string[] parts)
    {
        int[] face = new int[parts.Length - 1];
        for (int i = 1; i < parts.Length; i++)
        {
            string[] indices = parts[i].Split('/');
            int vertexIndex = int.Parse(indices[0]) - 1;
            face[i - 1] = vertexIndex;
        }

        list.Add(face);
    }

    bool[,,] Voxelize(List<Vector3> vertices, List<int[]> faces)
    {
        // 计算边界框
        Vector3 minBound = CalculateMinBound(vertices);
        Vector3 maxBound = CalculateMaxBound(vertices);

        // 计算模型的长宽高
        Vector3 modelSize = maxBound - minBound;

        // 计算体素网格分辨率
        int voxelResolutionX = Mathf.CeilToInt(modelSize.x); // 取模型长宽高中的最大值作为体素网格的分辨率
        int voxelResolutionY = Mathf.CeilToInt(modelSize.y);
        int voxelResolutionZ = Mathf.CeilToInt(modelSize.z);

        int maxV = voxelResolution / Mathf.Max(voxelResolutionX, voxelResolutionY, voxelResolutionZ);

        voxelResolutionX *= maxV;
        voxelResolutionY *= maxV;
        voxelResolutionZ *= maxV;
        
        // 创建体素网格
        bool[,,] voxelGrid = new bool[voxelResolutionX, voxelResolutionY, voxelResolutionZ];

        // 进行体素化
        foreach (int[] face in faces)
        {
            Vector3 v1 = vertices[face[0]];
            Vector3 v2 = vertices[face[1]];
            Vector3 v3 = vertices[face[2]];
            VoxelizeTriangle(v1, v2, v3, voxelGrid, minBound, modelSize);
        }

        return voxelGrid;
    }

    void VoxelizeTriangle(Vector3 v1, Vector3 v2, Vector3 v3, bool[,,] voxelGrid, Vector3 minBound, Vector3 modelSize)
    {
        // 计算三角形边界框
        Vector3 minVertex = Vector3.Min(Vector3.Min(v1, v2), v3);
        Vector3 maxVertex = Vector3.Max(Vector3.Max(v1, v2), v3);

        int minX = Mathf.Clamp(Mathf.FloorToInt((minVertex.x - minBound.x) / modelSize.x * voxelGrid.GetLength(0)), 0,
            voxelGrid.GetLength(0) - 1);
        int minY = Mathf.Clamp(Mathf.FloorToInt((minVertex.y - minBound.y) / modelSize.y * voxelGrid.GetLength(1)), 0,
            voxelGrid.GetLength(1) - 1);
        int minZ = Mathf.Clamp(Mathf.FloorToInt((minVertex.z - minBound.z) / modelSize.z * voxelGrid.GetLength(2)), 0,
            voxelGrid.GetLength(2) - 1);
        int maxX = Mathf.Clamp(Mathf.CeilToInt((maxVertex.x - minBound.x) / modelSize.x * voxelGrid.GetLength(0)), 0,
            voxelGrid.GetLength(0) - 1);
        int maxY = Mathf.Clamp(Mathf.CeilToInt((maxVertex.y - minBound.y) / modelSize.y * voxelGrid.GetLength(1)), 0,
            voxelGrid.GetLength(1) - 1);
        int maxZ = Mathf.Clamp(Mathf.CeilToInt((maxVertex.z - minBound.z) / modelSize.z * voxelGrid.GetLength(2)), 0,
            voxelGrid.GetLength(2) - 1);

        // 逐个体素进行检查
        for (int x = minX; x <= maxX; x++)
        {
            for (int y = minY; y <= maxY; y++)
            {
                for (int z = minZ; z <= maxZ; z++)
                {
                    Vector3 p = new Vector3(x + 0.5f, y + 0.5f, z + 0.5f);
                    if (PointInTriangle(p, v1, v2, v3))
                    {
                        voxelGrid[x, y, z] = true;
                    }
                    else if (PointOnTriangleBoundary(p.x, p.y, p.z, v1, v2, v3))
                    {
                        voxelGrid[x, y, z] = true;
                    }
                }
            }
        }
    }


    // 判断点(px, py, pz)是否在三角形的边界上
    bool PointOnTriangleBoundary(float px, float py, float pz, Vector3 v1, Vector3 v2, Vector3 v3)
    {
        bool IsBetween(float a, float b, float c)
        {
            return Mathf.Min(a, b) <= c && c <= Mathf.Max(a, b);
        }

        // 计算三角形的边
        float edge1 = Vector3.Cross(v1 - v2, v1 - new Vector3(px, py, pz)).magnitude;
        float edge2 = Vector3.Cross(v2 - v3, v2 - new Vector3(px, py, pz)).magnitude;
        float edge3 = Vector3.Cross(v3 - v1, v3 - new Vector3(px, py, pz)).magnitude;

        return IsBetween(0, 1, edge1 / (Vector3.Distance(v1, v2) + Vector3.Distance(v1, new Vector3(px, py, pz)))) &&
               IsBetween(0, 1, edge2 / (Vector3.Distance(v2, v3) + Vector3.Distance(v2, new Vector3(px, py, pz)))) &&
               IsBetween(0, 1, edge3 / (Vector3.Distance(v3, v1) + Vector3.Distance(v3, new Vector3(px, py, pz))));
    }

    // 判断点p是否在三角形内部
    bool PointInTriangle(Vector3 p, Vector3 v1, Vector3 v2, Vector3 v3)
    {
        float Sign(Vector3 p1, Vector3 p2, Vector3 p3)
        {
            return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
        }

        bool b1 = Sign(p, v1, v2) < 0.0f;
        bool b2 = Sign(p, v2, v3) < 0.0f;
        bool b3 = Sign(p, v3, v1) < 0.0f;

        return (b1 == b2) && (b2 == b3);
    }

    Vector3 CalculateMinBound(List<Vector3> vertices)
    {
        Vector3 minBound = new Vector3(float.MaxValue, float.MaxValue, float.MaxValue);
        foreach (Vector3 vertex in vertices)
        {
            minBound = Vector3.Min(minBound, vertex);
        }

        return minBound;
    }

    Vector3 CalculateMaxBound(List<Vector3> vertices)
    {
        Vector3 maxBound = new Vector3(float.MinValue, float.MinValue, float.MinValue);
        foreach (Vector3 vertex in vertices)
        {
            maxBound = Vector3.Max(maxBound, vertex);
        }

        return maxBound;
    }

    void InstantiateCubes(bool[,,] voxelGrid)
    {
        // 遍历体素网格，生成cube
        for (int x = 0; x < voxelGrid.GetLength(0); x++)
        {
            for (int y = 0; y < voxelGrid.GetLength(1); y++)
            {
                for (int z = 0; z < voxelGrid.GetLength(2); z++)
                {
                    if (voxelGrid[x, y, z])
                    {
                        // 生成cube
                        Vector3 position = new Vector3(x + 0.5f, y + 0.5f, z + 0.5f);
                        GameObject cube = Instantiate(cubePrefab, position, Quaternion.identity);
                        cube.transform.localScale = Vector3.one;
                        cube.transform.SetParent(Creat.transform);
                    }
                }
            }
        }
    }

    private void GetNameV()
    {
        if (name.text == "")
        {
            foreach (Transform child in Creat.transform)
            {
                Destroy(child.gameObject);
            }

            return;
        }

        fileName = name.text;
        if (pixel.text != "")
            voxelResolution = int.Parse(pixel.text);
        // 删除所有子对象
        foreach (Transform child in Creat.transform)
        {
            Destroy(child.gameObject);
        }

        VoxelizeOBJFile();
    }
}

```