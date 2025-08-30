# 七牛云配置说明

## 环境变量配置

在启动Python导出服务之前，需要设置以下环境变量：

```bash
export QINIU_ACCESS_KEY="your_access_key_here"
export QINIU_SECRET_KEY="your_secret_key_here"
export QINIU_BUCKET_NAME="your_bucket_name_here"
export QINIU_DOMAIN="your_domain_here"
```

## 获取七牛云配置

1. 登录七牛云控制台
2. 在"密钥管理"中获取 AccessKey 和 SecretKey
3. 在"对象存储"中获取 Bucket 名称
4. 在"空间管理"中获取域名

## 启动服务

```bash
# 设置环境变量
export QINIU_ACCESS_KEY="your_key"
export QINIU_SECRET_KEY="your_secret"
export QINIU_BUCKET_NAME="your_bucket"
export QINIU_DOMAIN="your_domain"

# 启动服务
python fastapi_export_server.py
```

## 工作流程

1. 视频导出完成后，自动上传到七牛云
2. 返回云存储URL给前端
3. 前端直接从七牛云下载文件
4. 避免本地文件路径问题

## 注意事项

- 确保七牛云配置正确
- 网络连接正常
- 有足够的上传权限
