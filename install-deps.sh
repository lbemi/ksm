#!/bin/bash

# Ubuntu依赖安装脚本 - 兼容不同Ubuntu版本
# 用于GitHub Actions和本地开发

echo "🔧 安装Ubuntu依赖包..."

# 更新包列表
sudo apt-get update

# 基础依赖包
echo "安装基础依赖..."
sudo apt-get install -y \
    libgtk-3-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    curl \
    wget \
    build-essential

# WebKit依赖 - 尝试多个版本
echo "安装WebKit依赖..."
if sudo apt-get install -y webkit2gtk-4.1-dev 2>/dev/null; then
    echo "✅ 成功安装 webkit2gtk-4.1-dev"
elif sudo apt-get install -y webkit2gtk-4.0-dev 2>/dev/null; then
    echo "✅ 成功安装 webkit2gtk-4.0-dev"
elif sudo apt-get install -y libwebkit2gtk-4.0-dev 2>/dev/null; then
    echo "✅ 成功安装 libwebkit2gtk-4.0-dev"
else
    echo "❌ 无法安装WebKit依赖包"
    echo "尝试安装替代包..."
    sudo apt-get install -y libwebkit2gtk-4.0-dev || \
    sudo apt-get install -y webkit2gtk-4.0-dev || \
    sudo apt-get install -y libwebkit2gtk-4.1-dev || \
    echo "⚠️  警告: WebKit依赖安装失败，可能影响Tauri构建"
fi

# 验证安装
echo "验证安装..."
dpkg -l | grep -E "(webkit2gtk|libwebkit2gtk)" || echo "⚠️  未找到WebKit包"

echo "✅ 依赖安装完成！"
