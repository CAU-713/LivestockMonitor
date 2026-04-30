"""
批量导入服务层
支持从 Excel/CSV 批量导入动物档案和体重记录
"""
import csv
import io
from datetime import date
from typing import List, Optional

from sqlmodel import Session, select

from app.models.AnimalDO import AnimalDO
from app.models.FacilityDO import ShedDO
from app.models.HealthDataDO import WeightRecordDO
from app.schemas.importDTO import ImportResultDTO, ImportErrorItem


def _parse_date(val: str) -> Optional[date]:
    """解析日期字符串，支持多种格式"""
    if not val:
        return None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            from datetime import datetime
            return datetime.strptime(str(val).strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"无法解析日期: {val}")


def _parse_float(val) -> Optional[float]:
    """解析浮点数"""
    if val is None or str(val).strip() == "":
        return None
    try:
        return float(str(val).strip())
    except ValueError:
        raise ValueError(f"无法解析数字: {val}")


class ImportService:
    """批量导入服务类"""

    @staticmethod
    def import_animals(db: Session, file_bytes: bytes, filename: str) -> ImportResultDTO:
        """
        批量导入动物档案

        Excel/CSV 列顺序（必须按此顺序）：
        编号 | 品种 | 性别(male/female) | 出生日期(YYYY-MM-DD) | 进场日期(YYYY-MM-DD) |
        羊舍名称 | 生产类型(breeding/fattening/test) | 健康状态(good/ill/under_treatment) |
        年龄(月) | 描述
        """
        errors: List[ImportErrorItem] = []
        success_count = 0

        # 加载羊舍名称→ID 映射
        sheds = db.exec(select(ShedDO)).all()
        shed_map = {s.name: s.id for s in sheds}

        rows = ImportService._read_rows(file_bytes, filename)

        for i, row in enumerate(rows, start=2):  # 从第2行开始（第1行是表头）
            try:
                if len(row) < 7:
                    raise ValueError(f"列数不足（需要至少7列，实际{len(row)}列）")

                name = str(row[0]).strip()
                breed = str(row[1]).strip()
                gender = str(row[2]).strip().lower()
                birth_date_str = str(row[3]).strip()
                entry_date_str = str(row[4]).strip() if len(row) > 4 else ""
                shed_name = str(row[5]).strip() if len(row) > 5 else ""
                production_type = str(row[6]).strip().lower() if len(row) > 6 else "fattening"
                health_status = str(row[7]).strip().lower() if len(row) > 7 else "good"
                age_str = str(row[8]).strip() if len(row) > 8 else ""
                description = str(row[9]).strip() if len(row) > 9 else None

                # 校验必填字段
                if not name:
                    raise ValueError("编号不能为空")
                if not breed:
                    raise ValueError("品种不能为空")
                if gender not in ("male", "female"):
                    raise ValueError("性别必须是 male 或 female")
                if production_type not in ("breeding", "fattening", "test"):
                    raise ValueError("生产类型必须是 breeding/fattening/test")
                if health_status not in ("good", "ill", "under_treatment", "removal"):
                    health_status = "good"

                birth_date = _parse_date(birth_date_str)
                if not birth_date:
                    raise ValueError("出生日期不能为空")

                entry_date = _parse_date(entry_date_str) or date.today()

                # 查找羊舍
                shed_id = shed_map.get(shed_name)
                if not shed_id and shed_name:
                    raise ValueError(f"羊舍 '{shed_name}' 不存在")
                if not shed_id:
                    # 如果没有指定羊舍，使用第一个
                    if sheds:
                        shed_id = sheds[0].id
                    else:
                        raise ValueError("系统中没有羊舍，请先创建羊舍")

                # 计算年龄
                try:
                    age = int(age_str) if age_str else (
                        (date.today().year - birth_date.year) * 12 +
                        (date.today().month - birth_date.month)
                    )
                except ValueError:
                    age = 0

                animal = AnimalDO(
                    name=name,
                    breed=breed,
                    gender=gender,
                    birth_date=birth_date,
                    entry_date=entry_date,
                    shed_id=shed_id,
                    production_type=production_type,
                    health_status=health_status,
                    age=max(0, age),
                    description=description if description else None,
                )
                db.add(animal)
                db.flush()  # flush to catch DB errors before commit
                success_count += 1

            except Exception as e:
                errors.append(ImportErrorItem(row=i, reason=str(e)))

        if success_count > 0:
            db.commit()
        else:
            db.rollback()

        return ImportResultDTO(
            success_count=success_count,
            fail_count=len(errors),
            errors=errors,
        )

    @staticmethod
    def import_weight_records(db: Session, file_bytes: bytes, filename: str) -> ImportResultDTO:
        """
        批量导入体重记录

        Excel/CSV 列顺序（必须按此顺序）：
        动物编号 | 测量日期(YYYY-MM-DD) | 测量时间(HH:MM:SS) | 体重(kg)
        """
        from datetime import time as dtime

        errors: List[ImportErrorItem] = []
        success_count = 0

        # 加载动物编号→ID 映射
        animals = db.exec(select(AnimalDO)).all()
        animal_map = {a.name: a.id for a in animals}

        rows = ImportService._read_rows(file_bytes, filename)

        for i, row in enumerate(rows, start=2):
            try:
                if len(row) < 4:
                    raise ValueError(f"列数不足（需要4列，实际{len(row)}列）")

                animal_name = str(row[0]).strip()
                date_str = str(row[1]).strip()
                time_str = str(row[2]).strip() or "08:00:00"
                weight_str = str(row[3]).strip()

                if not animal_name:
                    raise ValueError("动物编号不能为空")

                animal_id = animal_map.get(animal_name)
                if not animal_id:
                    raise ValueError(f"动物编号 '{animal_name}' 不存在")

                record_date = _parse_date(date_str)
                if not record_date:
                    raise ValueError("测量日期不能为空")

                # 解析时间
                try:
                    parts = time_str.split(":")
                    weighing_time = dtime(
                        int(parts[0]),
                        int(parts[1]) if len(parts) > 1 else 0,
                        int(parts[2]) if len(parts) > 2 else 0
                    )
                except Exception:
                    weighing_time = dtime(8, 0, 0)

                weight = _parse_float(weight_str)
                if weight is None or weight <= 0:
                    raise ValueError("体重必须大于0")

                record = WeightRecordDO(
                    animal_id=animal_id,
                    record_date=record_date,
                    weighing_time=weighing_time,
                    weight_kg=weight,
                )
                db.add(record)
                db.flush()
                success_count += 1

            except Exception as e:
                errors.append(ImportErrorItem(row=i, reason=str(e)))

        if success_count > 0:
            db.commit()
        else:
            db.rollback()

        return ImportResultDTO(
            success_count=success_count,
            fail_count=len(errors),
            errors=errors,
        )

    @staticmethod
    def _read_rows(file_bytes: bytes, filename: str) -> List[List[str]]:
        """读取 Excel 或 CSV 文件，返回数据行（跳过表头）"""
        fname = filename.lower()
        if fname.endswith(".xlsx") or fname.endswith(".xls"):
            return ImportService._read_excel(file_bytes)
        else:
            return ImportService._read_csv(file_bytes)

    @staticmethod
    def _read_excel(file_bytes: bytes) -> List[List[str]]:
        """读取 Excel 文件"""
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
        ws = wb.active
        rows = []
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                continue  # 跳过表头
            if all(v is None or str(v).strip() == "" for v in row):
                continue  # 跳过空行
            rows.append([str(v) if v is not None else "" for v in row])
        return rows

    @staticmethod
    def _read_csv(file_bytes: bytes) -> List[List[str]]:
        """读取 CSV 文件"""
        text = file_bytes.decode("utf-8-sig")  # 兼容 BOM
        reader = csv.reader(io.StringIO(text))
        rows = []
        for i, row in enumerate(reader):
            if i == 0:
                continue  # 跳过表头
            if all(cell.strip() == "" for cell in row):
                continue  # 跳过空行
            rows.append(row)
        return rows

    @staticmethod
    def generate_animal_template() -> bytes:
        """生成动物档案导入模板（xlsx）"""
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "动物档案导入模板"

        headers = [
            "编号*", "品种*", "性别*(male/female)", "出生日期*(YYYY-MM-DD)",
            "进场日期(YYYY-MM-DD)", "羊舍名称", "生产类型*(breeding/fattening/test)",
            "健康状态(good/ill/under_treatment)", "年龄(月)", "描述"
        ]

        # 设置表头样式
        header_fill = PatternFill(start_color="4CAF50", end_color="4CAF50", fill_type="solid")
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")
            ws.column_dimensions[ws.cell(row=1, column=col).column_letter].width = 20

        # 添加示例数据行
        examples = [
            ["YF-2026-001", "小尾寒羊", "male", "2024-01-15", "2024-03-01",
             "A育肥舍", "fattening", "good", "27", ""],
            ["YF-2026-002", "湖羊", "female", "2024-06-20", "2024-09-01",
             "B繁殖舍", "breeding", "good", "21", ""],
        ]
        for row_data in examples:
            ws.append(row_data)

        output = io.BytesIO()
        wb.save(output)
        return output.getvalue()

    @staticmethod
    def generate_weight_template() -> bytes:
        """生成体重记录导入模板（xlsx）"""
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "体重记录导入模板"

        headers = ["动物编号*", "测量日期*(YYYY-MM-DD)", "测量时间(HH:MM:SS)", "体重kg*"]

        header_fill = PatternFill(start_color="2196F3", end_color="2196F3", fill_type="solid")
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")
            ws.column_dimensions[ws.cell(row=1, column=col).column_letter].width = 22

        # 示例数据
        examples = [
            ["YF-2026-001", "2026-04-28", "08:00:00", 45.5],
            ["YF-2026-002", "2026-04-28", "08:00:00", 38.2],
        ]
        for row_data in examples:
            ws.append(row_data)

        output = io.BytesIO()
        wb.save(output)
        return output.getvalue()
