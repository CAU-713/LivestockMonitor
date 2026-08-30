#  系统部署（pred_nh3_部署）

---

## 1. 目录结构

```
pred_nh3_部署/
├─ db_config.py            # 数据库连接配置（与实时部署相同）
├─ load_wide.py            # 读库转宽表（只读 26 个输入 pointId，不含 NH3）
├─ predict.py              # 预测函数（XLinearNH3: 26->27，输出长表 72步×27变量）
├─ save_forecast.py        # 预测结果写库（device_forecast_save）
├─ run_pipeline.py         # 主流程（单次 / --loop 循环）
├─ feature_cols_x.json     # 输入特征 26 个（不含 NH3）
├─ feature_cols_y.json     # 输出特征 27 个（含 NH3）
├─ scaler_x.pkl            # 输入标准化（26维，仅fit训练集）
├─ scaler_y.pkl            # 输出标准化（27维，仅fit训练集）
├─ models/
│  └─ XLinear_s0.pt        # 模型权重
├─ demo_input.csv          # 演示输入（288行×26特征，取自测试集样本）
├─ demo_output.csv         # 演示输出（1944行长表）
└─ README.md               # 本说明
```

## 2. 模型说明

| 项 | 值 |
|---|---|
| 模型 | XLinear （26→27） |
| 输入 | 26 个环境变量（去掉 `NH3-S_NH3南`），288×5min=24小时 |
| 输出 | 27 个变量（**含 NH3**），72×5min=6小时 |
| 结构 | `proj(26→27) + Linear(288→72)`，减均值→映射→加回 |
| 训练 | seed=0，Adam 1e-3，batch512，epochs60，patience10，MSE+物理约束 |
| 精度 | 总体 R2=0.62；**NH3 R2=-1.62* |

## 3. 使用方式

### 3.1 单次运行（读库→预测→写库）
```bash
python run_pipeline.py
```

### 3.2 循环运行（每5分钟）
```bash
python run_pipeline.py --loop
```

### 3.3 本地演示（不连数据库）
```bash
python predict.py
# 读取 demo_input.csv -> 输出 demo_output.csv
```

### 3.4 代码调用
```python
import pandas as pd
from predict import predict_environment

wide = pd.read_csv("demo_input.csv")          # 288行 × (时间+26特征)
forecast = predict_environment(wide, gateway_mac="4529ecf8d0b5", device_id="PLC")
# forecast: 1944行 = 72步 × 27变量（含 NH3-S）
```

## 4. 数据流

```
MySQL(device_data_save)
   └─ load_wide.py 查询最近24h内26个pointId
        └─ 5min聚合宽表 [时间, 26特征] 288行
             └─ predict.py: scaler_x → XLinearNH3 → scaler_y → clamp物理范围
                  └─ 长表 [batch_id, ..., pointId, predicted_value] 1944行
                       └─ save_forecast.py 写 device_forecast_save
```
