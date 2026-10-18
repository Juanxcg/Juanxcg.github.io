---
title: Rocky Linux 9.7 安装 NVIDIA 驱动：双 RTX 5050 六屏配置与踩坑记录
date: 2026-10-18 22:54:42
tags:
  - Linux
  - Rocky Linux
  - NVIDIA
  - 多屏显示
categories: 教程
permalink: rocky-linux-9-7-dual-rtx-5050/
description: 记录 Rocky Linux 9.7 安装 NVIDIA 开放内核模块驱动、配置双 RTX 5050 六屏的过程，整理内核开发包缺失、DKMS 依赖、Secure Boot 和第二张显卡显示输出未启用等问题。
cover: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/rocky-linux-9-7-dual-rtx-5050/cover-rocky-linux-9-7.png
top_img: https://cdn.jsdelivr.net/gh/Juanxcg/blog-img/backGround.png
---

# 前述

最近在配置 Rocky Linux 9.7 的时候，需要让两张 RTX 5050 各带三个显示器，实现六屏扩展显示。原本以为装好显卡驱动就可以了，实际操作中却遇到了内核开发包缺失、安装依赖时带入新内核、Wi-Fi 无法使用，以及驱动装好了却加载不了等问题。

这篇文章把两台机器的安装和排错过程整理一下，也方便以后遇到相同问题时查阅。第一台已经实现两张卡各带三屏；第二台在关闭 Secure Boot 后解决了驱动加载问题，六屏重启恢复的结果还需要单独验收。

**这次最终采用的方案是：保留 Wi-Fi 正常的原内核，补齐对应开发包，安装 NVIDIA 开放内核模块驱动，使用 X11，关闭原配置中的 SLI/BaseMosaic，再启用第二张显卡的三个输出并保存布局。**

**PS：下面的内核版本、驱动版本和接口名称来自本次实际环境，照着操作之前一定要先核对自己的机器。**

<!-- more -->

# 本次环境与结果

| 项目 | 本次记录 |
| --- | --- |
| 初始安装系统 | Rocky Linux 9.7，x86_64 |
| 最终采用的内核 | `5.14.0-611.5.1.el9_7.x86_64` |
| 显卡 | 两张 GeForce RTX 5050，另有 Intel 核显 |
| 本次安装的 NVIDIA 驱动 | `615.71.09`，开放内核模块 |
| 桌面会话 | X11 / Xorg |
| Secure Boot | 关闭 |
| 第一台结果 | 两张卡各带三屏，六屏全部亮起，后续设置可用 |
| 第二台结果 | 关闭 Secure Boot 后驱动恢复正常；暂未单独记录六屏重启验收结果 |

这里先说明一个关键点：RTX 5050 属于 Blackwell 架构，需要使用 **NVIDIA 开放内核模块**。它与 Nouveau 驱动不同，两张同型号显卡也只需要安装一套驱动。NVIDIA 在[开放内核模块说明](https://download.nvidia.com/XFree86/Linux-x86_64/580.142/README/kernel_open.html)中明确说明，Blackwell 及后续架构仅由开放内核模块支持。

**另一台电脑的内核、接口名和配置文件必须按实际结果核对。本文中的精确 RPM 地址只适用于上述内核版本。**

本文的 `--exclude` 参数只限制当前安装事务，不会永久锁定内核或系统版本。保留旧内核也不等于撤销此前更新过的其他软件包；默认 Rocky 9 软件源可能提供后续 9.x 小版本的依赖。若必须严格冻结整个发行版，需要另行规划软件源及版本策略。

# 安装前与 BIOS 设置

1. 备份系统盘重要资料；核对安装磁盘，必要时先断开数据盘。
2. 使用 Rocky Linux 9.7 x86_64 DVD 镜像，选择“工作站”或“带 GUI 的服务器”。
3. 创建具有管理员权限的日常用户。
4. 保留两张显卡，初始调试可先连接一台显示器；连接 Wi-Fi 或有线网络。
5. 使用 UEFI 启动，保持已验证可用的磁盘控制器设置。
6. 本次采用关闭 Secure Boot 的路径。

华硕主板常见路径：

```text
F7 → Advanced Mode → Boot → Secure Boot → OS Type → Other OS
```

如果 BIOS 提供 `Secure Boot Control` 开关，则设置为 `Disabled`。无需清除安全启动密钥或 TPM，也无需改为 Legacy 启动。

关闭 Secure Boot 会减少启动签名验证保护；若环境要求保留开启，则需另外完成模块签名与密钥登记。参见 [华硕官方安全启动说明](https://www.asus.com.cn/support/faq/1049829/)。

# 检查系统、网络和双卡

以下命令在目标 Rocky 系统中执行，不是在其他电脑上执行。

```bash
cat /etc/rocky-release
uname -r
mokutil --sb-state
lspci -nnk | grep -A3 -Ei 'VGA|3D|Display'
echo "$XDG_SESSION_TYPE"
cat /proc/cmdline
```

本次目标内核：

```text
5.14.0-611.5.1.el9_7.x86_64
```

成功路径的安全启动状态：

```text
SecureBoot disabled
```

若 `mokutil` 或 `lspci` 不存在，可在联网后按“准备工具与匹配的开发包”一节安装工具，再回来检查。

如果出现 `Could not resolve host`，先检查网络：

```bash
nmcli device status
getent hosts mirrors.rockylinux.org
getent hosts developer.download.nvidia.com
```

本次第一次下载失败，是尚未连接 Wi-Fi。后续又曾因新内核下无线网络不可用而无法下载。

# 保留网络正常的内核

这次有一个比较容易绕进去的坑：安装不指定版本的 `kernel-devel-matched` 时，依赖把新内核一起带进来了。重启到新内核后，Wi-Fi 无法使用；切回原来的内核，Wi-Fi 又恢复了。

所以我后面采用的办法是：**保留网络正常的原内核，再给它补齐相同版本的开发包。** 这是针对这两台机器的处理方式，并不是说 Rocky 的新内核都不能使用无线网络。

如果当前已经运行正确内核，只需检查默认启动项：

```bash
sudo grubby --default-kernel
```

如果需要恢复本次旧内核，先确认启动项存在：

```bash
sudo grubby --info=/boot/vmlinuz-5.14.0-611.5.1.el9_7.x86_64
```

正常显示该启动项后，再执行：

```bash
sudo grubby --set-default=/boot/vmlinuz-5.14.0-611.5.1.el9_7.x86_64
sudo grubby --default-kernel
```

保存工作后重启，用 `uname -r` 确认。若旧启动项不存在，不要照抄设置命令。

# 准备工具与匹配的开发包

## 准备软件源

```bash
sudo dnf install dnf-plugins-core mokutil pciutils --exclude='kernel*'
sudo dnf config-manager --set-enabled crb
sudo dnf install epel-release --exclude='kernel*'
```

安装时核对事务列表；任何一步报错就停在该步骤，不要通过 `--allowerasing` 或取消所有排除条件强行继续。

## 安装两个精确匹配的开发包

**仅在 `uname -r` 为 `5.14.0-611.5.1.el9_7.x86_64` 时使用下面的地址。**

先安装 `kernel-devel`：

```bash
sudo dnf install https://download.rockylinux.org/vault/rocky/9.7/AppStream/x86_64/os/Packages/k/kernel-devel-5.14.0-611.5.1.el9_7.x86_64.rpm --exclude=kernel --exclude=kernel-core --exclude='kernel-modules*'
```

再安装同版本 `kernel-devel-matched`：

```bash
sudo dnf install https://download.rockylinux.org/vault/rocky/9.7/AppStream/x86_64/os/Packages/k/kernel-devel-matched-5.14.0-611.5.1.el9_7.x86_64.rpm --exclude=kernel --exclude=kernel-core --exclude='kernel-modules*'
```

这两个精确版本都可以在 [Rocky 9.7 官方归档](https://download.rockylinux.org/vault/rocky/9.7/AppStream/x86_64/os/Packages/k/)中找到。两者作用不同：

- `kernel-devel` 提供编译驱动所需的内核开发目录。
- `kernel-devel-matched` 提供匹配依赖关系；第二台的 DKMS 包明确要求它。

**不要将第二条改成不带版本的 `dnf install kernel-devel-matched`。** 本次用官方归档中的精确版本满足依赖，同时排除运行内核包变化。

检查：

```bash
rpm -q "kernel-devel-$(uname -r)"
rpm -q "kernel-devel-matched-$(uname -r)"
ls -l "/lib/modules/$(uname -r)/build/Makefile"
```

三条均正常后继续。用于内核模块构建的 `kernel-devel` 必须匹配运行内核；不要仅因用户空间 `kernel-headers` 包版本不同就盲目降级它。

## 归档下载慢时

若正在下载阶段，可以取消后改为支持断点续传的下载；进入 `Running transaction` 后不要中断。

```bash
curl -fL -C - --retry 3 -o "$HOME/kernel-devel-5.14.0-611.5.1.el9_7.x86_64.rpm" https://download.rockylinux.org/vault/rocky/9.7/AppStream/x86_64/os/Packages/k/kernel-devel-5.14.0-611.5.1.el9_7.x86_64.rpm
```

完整下载成功后再安装：

```bash
sudo dnf install "$HOME/kernel-devel-5.14.0-611.5.1.el9_7.x86_64.rpm" --exclude=kernel --exclude=kernel-core --exclude='kernel-modules*'
```

分开下载并不能保证提速，但中断后可继续下载；也可将完整 RPM 用 U 盘复制到另一台机器。安装成功后仍需准备前面的 matched 包。

# 安装 NVIDIA 开放模块驱动

安装方式参考 [NVIDIA 的 Rocky Linux 驱动安装文档](https://docs.nvidia.com/datacenter/tesla/driver-installation-guide/rocky-linux.html)。下面在官方仓库安装流程的基础上，保留了本次避免切换运行内核的排除参数。

如果目标系统已经有其他来源或 `.run` 安装的驱动，不应直接混装；先确认并处理原安装方式。本节针对新装或沿用本次官方仓库路径的系统。

```bash
sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64/cuda-rhel9.repo
sudo dnf clean expire-cache
sudo dnf module enable nvidia-driver:open-dkms
sudo dnf install nvidia-open --exclude='kernel*'
```

Rocky 9 对应 NVIDIA 仓库代号 `rhel9`。`config-manager` 中间是连字符。

本次安装版本为 `615.71.09`；`open-dkms` 会随软件源更新，并未固定驱动版本。需要显示桌面，因此采用包含桌面组件的 `nvidia-open`，而不是仅计算用途的安装组合。

安装结束后检查当前内核的模块：

```bash
sudo dkms autoinstall -k "$(uname -r)"
dkms status
modinfo -k "$(uname -r)" -F license nvidia
sudo grubby --default-kernel
```

预期：

- 当前内核对应的 NVIDIA 条目显示 `installed`。
- 许可证显示 `Dual MIT/GPL`。
- 默认启动内核仍为保留的旧内核。

`dkms autoinstall` 若没有输出并立即返回提示符，可能是模块已在软件包安装阶段构建完成；以检查结果为准。尚未返回提示符时，不要重复运行或立即关机。

保存工作后重启：

```bash
sudo reboot
```

重新登录检查：

```bash
uname -r
nvidia-smi -L
```

应列出两张 RTX 5050。这里是大写 `-L`；小写 `-l` 表示循环刷新。

# 使用 X11，检查 SLI/BaseMosaic

本次六屏成功采用 X11。登录界面选择用户后，在会话选项中选择“GNOME on Xorg”（如提供该选项）。进入桌面检查：

```bash
echo "$XDG_SESSION_TYPE"
```

应显示 `x11`。不要因为切换为 X11 就认为驱动损坏。

检查当前配置：

```bash
cat /etc/X11/xorg.conf.d/10-nvidia.conf
```

第一台曾存在以下两项：

```text
Option "SLI" "Auto"
Option "BaseMosaic" "on"
```

当时 `nvidia-smi` 可以查询到两张卡，但 `xrandr --listproviders` 只有一个 NVIDIA 显示提供者。关闭这两项并重启后，第二个 NVIDIA 显示提供者出现。这验证了本次配置修改有效，但不表示所有双卡故障都由这两项造成。

## 有相同配置时，先备份再修改

以下备份命令首次执行一次即可；不要用后续状态覆盖原始备份。

```bash
sudo cp -a /etc/X11/xorg.conf.d/10-nvidia.conf /etc/X11/10-nvidia.conf.before-dual-gpu
```

```bash
sudo sed -i '/"SLI"/s/"Auto"/"Off"/; /"BaseMosaic"/s/"on"/"off"/' /etc/X11/xorg.conf.d/10-nvidia.conf
cat /etc/X11/xorg.conf.d/10-nvidia.conf
```

本次最终文件内容记录如下，供核对：

```text
Section "OutputClass"
    Identifier "nvidia"
    MatchDriver "nvidia-drm"
    Driver "nvidia"
    Option "AllowEmptyInitialConfiguration"
    Option "PrimaryGPU" "yes"
    Option "SLI" "Off"
    Option "BaseMosaic" "off"
EndSection
```

如果另一台没有该文件、选项不同或配置复杂，不要直接用上面的样例覆盖全部设置。上述替换命令只针对本次实际出现的值，执行后必须查看结果。

保存工作后重启，继续使用原内核和 X11。

# 识别并启用六个屏幕

在当前图形桌面的终端运行：

```bash
xrandr --listproviders
xrandr --query | grep -E ' connected| disconnected'
sudo cat /sys/module/nvidia_drm/parameters/modeset
```

本次修正配置后的记录：

| 显示提供者 | 能力与含义 |
| --- | --- |
| `NVIDIA-0` | 第一张 NVIDIA 显卡，`Source Output` |
| `NVIDIA-G0` | 第二张 NVIDIA 显卡，`Sink Output` |
| `modesetting` | 额外显示提供者，不能仅凭名称认作第二张 RTX 5050 |

`modeset` 为 `Y`。第二张卡已关联到当前桌面，因此本次没有再执行手动 provider 关联命令。

本次接口记录：

| 显卡 | 已连接输出 | 启用前状态 |
| --- | --- | --- |
| 第一张 | `DP-0`、`DP-2`、`DP-4` | 已显示分辨率与位置 |
| 第二张 | `DP-1-0`、`DP-1-2`、`DP-1-4` | `connected`，但没有分辨率与位置 |

`connected` 但没有分辨率和位置，表示被识别但没有启用输出。`nvidia-smi` 的 `Disp.A Off` 是显示状态，不是可以直接打开的开关；启用持久模式也不是点亮显示器的方法。

**仅当实际接口名称与上表一致时，使用本次成功的命令：**

```bash
xrandr --output DP-1-0 --auto --right-of DP-2 --output DP-1-2 --auto --right-of DP-1-0 --output DP-1-4 --auto --right-of DP-1-2
```

不加 `sudo`。这条命令以 `DP-2` 为参照，把新启用的三个屏幕依次排在它右侧；第一台执行后，六个屏幕就都亮起来了。最终摆放位置再到桌面设置里调整。

若接口名不同，必须替换为实际已连接接口；若第二个 NVIDIA 显示提供者尚未出现，不应直接套用此命令。

# 保存布局与完成验收

进入“设置 → 显示器”：

1. 使用扩展/加入显示器模式，按实际摆放位置排列六屏。
2. 选择主屏、分辨率和缩放比例。
3. 初次调试先使用约 60 Hz，稳定后再逐项调整。
4. 点击“应用”，确认保留更改。

命令行 `xrandr` 调整只影响当前会话。通过桌面设置保存布局后，仍需重启验证是否恢复。

验收项目：

- [ ] `uname -r` 为目标旧内核。
- [ ] Wi-Fi 可以连接。
- [ ] `nvidia-smi -L` 能列出两张卡。
- [ ] 六个显示输出均启用，可显示画面。
- [ ] 主屏、位置、分辨率和缩放符合实际摆放。
- [ ] 鼠标和窗口可以按预期跨屏移动。
- [ ] 重启并登录后，六屏和布局恢复。

如用于长期展示，再按需要调整自动挂起、锁屏和屏幕熄灭时间。

# 踩坑记录与故障截图

下面保留四张实际排错时的截图，方便遇到相同提示时对照。六屏点亮的过程按当时记录整理，没有附上缺失的结果截图。

## 开发目录缺失，DKMS 无法构建

![DKMS 报告旧内核的 build/source 开发目录不存在](about:blank)

截图中的报错为 `Your kernel headers ... cannot be found`。在本次 Rocky 环境中，通过补齐对应版本的 `kernel-devel` 并确认 `build/Makefile` 存在，解决了开发目录缺失问题。

## DKMS 还要求 kernel-devel-matched

![安装 NVIDIA 驱动时，DKMS 的 matched 依赖被 kernel 排除规则阻止](about:blank)

第二台出现的依赖关系是：DKMS 要求 `(kernel-devel-matched if kernel-core)`。`--exclude='kernel*'` 也会排除尚未安装的 matched 包。

解决方式是在安装驱动前，先从官方归档安装**与旧内核相同版本**的 matched 包；不是取消所有内核限制，也不是直接安装最新 matched 包。

## 软件包已安装，但 Secure Boot 开启，模块没有加载

![驱动包已安装，但 nvidia-smi 无法连接；Secure Boot 显示 enabled，模块列表为空](about:blank)

第二台截图显示：

- `nvidia-open` 已安装。
- `nvidia-smi` 无法连接 NVIDIA 驱动。
- `SecureBoot enabled`。
- `lsmod` 没有显示 NVIDIA 模块。

第二台关闭 Secure Boot 并重启后，驱动恢复正常。若安全启动必须保留，则应处理模块签名与信任登记，不能把关闭当成唯一方案。

![排查过程中读取的内核日志，主要显示证书和 NVIDIA HDMI/DP 音频设备记录](about:blank)

这张日志截图本身没有显示明确的签名拒绝错误。出现 NVIDIA 音频设备或证书字样，也不等于 NVIDIA 显示模块已经加载；应结合模块状态和 `nvidia-smi` 判断。

## 常用排错命令

```bash
uname -r
dkms status
mokutil --sb-state
lsmod | grep -E 'nvidia|nouveau'
sudo journalctl -k -b --no-pager | grep -Ei 'nvidia|nouveau|NVRM|verification|key was rejected' | tail -n 50
```

检查 Xorg 配置和本次启动日志：

```bash
cat /etc/X11/xorg.conf.d/10-nvidia.conf
ps -eo user,pid,args | grep '[X]org'
sudo journalctl -b _COMM=Xorg --no-pager -n 60
```

如果最后 60 行只有显示器探测记录，应继续查找更早的初始化/错误记录，不能据此断言不存在错误。旧的 `/var/log/Xorg.0.log` 也可能不属于当前会话。

# 黑屏时的恢复路径

如果安装或切换显示后黑屏，先等待几分钟并观察所有屏幕，避免在后台仍编译时断电。尝试 `Ctrl + Alt + F3` 或 `Ctrl + Alt + F4` 进入文字终端。

若无法操作，先尝试短按电源键正常关机；只有持续无响应时才考虑长按强制关机，后者可能丢失未写入数据。

通过 GRUB 临时进入文字模式：

1. 开机显示内核菜单，选择原来的 `611.5.1.el9_7` 内核。
2. 按 `e` 编辑。
3. 找到以 `linux` 开头的长行，保留 `root=` 等参数，删除 `rhgb quiet`。
4. 在该行末尾加空格及 `systemd.unit=multi-user.target`。
5. 按 `Ctrl + X` 启动，使用普通账户登录。

此修改只影响本次启动，不是重装或永久改成文字模式。

如果黑屏发生在修改 Xorg 配置之后，可恢复之前确实创建过的备份：

```bash
sudo cp -a /etc/X11/10-nvidia.conf.before-dual-gpu /etc/X11/xorg.conf.d/10-nvidia.conf
sudo reboot
```

# 参考资料

- [NVIDIA：Rocky Linux 驱动安装](https://docs.nvidia.com/datacenter/tesla/driver-installation-guide/rocky-linux.html)
- [NVIDIA：安装前检查与内核开发包](https://docs.nvidia.com/datacenter/tesla/driver-installation-guide/pre-installation-actions.html)
- [NVIDIA：开放内核模块与 Blackwell 支持](https://download.nvidia.com/XFree86/Linux-x86_64/580.142/README/kernel_open.html)
- [NVIDIA：X 配置选项，包括 SLI、BaseMosaic](https://download.nvidia.com/XFree86/Linux-x86_64/580.142/README/xconfigoptions.html)
- [NVIDIA：RandR 跨显卡显示说明](https://download.nvidia.com/XFree86/Linux-x86_64/575.64/README/randr14.html)
- [NVIDIA：nvidia-smi 字段说明](https://docs.nvidia.com/deploy/nvidia-smi/index.html)
- [Rocky：9.7 AppStream 官方归档](https://download.rockylinux.org/vault/rocky/9.7/AppStream/x86_64/os/Packages/k/)
- [Red Hat：默认内核修改](https://access.redhat.com/solutions/4326431)
- [Red Hat：systemd 启动目标与文字模式](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_basic_system_settings/managing-systemd_configuring-basic-system-settings)
- [华硕：开启或关闭 Secure Boot](https://www.asus.com.cn/support/faq/1049829/)
- [GNOME：多显示器与主屏设置](https://help.gnome.org/gnome-help/display-dual-monitors.html)

这篇文章记录的是本次环境下的安装和排错过程。以后更换内核或更新驱动时，我会重新检查 Wi-Fi、驱动模块和六屏布局是否能正常恢复；其他机器也需要按自己的内核版本和显示接口调整。
