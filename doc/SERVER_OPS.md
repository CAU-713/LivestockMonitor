# LivestockMonitor 运维与开发指南

> **本文档已迁移至 CodeFlicker Skill 系统。**
>
> 完整的运维手册、部署命令、踩坑记录、故障排查决策树等内容，
> 现在位于 `.codeflicker/skills/livestock-deploy/` 目录：
>
> - **入口文件**：`.codeflicker/skills/livestock-deploy/SKILL.md`（精简速查版）
> - **详细参考**：`.codeflicker/skills/livestock-deploy/references/server-ops.md`（完整版）
>
> AI 编程助手会自动加载 skill 并使用其中的信息，无需手动阅读本文档。
> 如需查阅完整内容，请直接阅读上述文件。

---

## 快速参考（常用命令）

```bash
# 部署前端（rsync + build + restart）
rsync -avz --delete --exclude='node_modules' --exclude='.next' \
  -e "ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10" \
  ./frontend/ ubuntu@120.53.24.48:/root/LivestockMonitor/frontend/

ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 300 bash -c 'cd /root/LivestockMonitor && sudo docker compose build frontend 2>&1 | tail -10'"

ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 30 bash -c 'cd /root/LivestockMonitor && sudo docker compose up -d --force-recreate frontend 2>&1'"

# 查看容器状态
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=10 ubuntu@120.53.24.48 \
  "timeout 10 sudo docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

> 更详细的命令和说明请参阅 `.codeflicker/skills/livestock-deploy/SKILL.md`