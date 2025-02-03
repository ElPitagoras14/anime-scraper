from datetime import datetime
import pytz


def add_filter_params(filters: dict) -> str:
    if not filters:
        return ""
    query = " WHERE"
    filter_query = []
    for key, values in filters.items():
        where_condition = f" {key} IN ("
        for value in values:
            if isinstance(value, int):
                where_condition += f"{value},"
            else:
                where_condition += f"'{value}',"
        where_condition = where_condition[:-1] + ")"
        filter_query.append(where_condition)
    query += " AND ".join(filter_query)
    return query


def add_sort_params(sort_by: str, desc: bool) -> str:
    query = ""
    if sort_by is not None:
        query += f" ORDER BY {sort_by}"
        if desc:
            query += " DESC"
        else:
            query += " ASC"
    return query


def add_pagination_params(page: int, size: int) -> str:
    query = ""
    if page is not None and size is not None:
        query += f" LIMIT {size} OFFSET {page * size}"
    return query


def format_size(size_in_bytes):
    if not size_in_bytes:
        return "Unknown"
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024**2:
        return f"{size_in_bytes / 1024:.2f} KB"
    elif size_in_bytes < 1024**3:
        return f"{size_in_bytes / 1024**2:.2f} MB"
    elif size_in_bytes < 1024**4:
        return f"{size_in_bytes / 1024**3:.2f} GB"
    else:
        return f"{size_in_bytes / 1024**4:.2f} TB"


def convert_size(size_in_bytes: int, unit: str) -> str:
    units = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3}

    unit = unit.upper()

    if unit not in units:
        raise ValueError("Unidad no válida. Usa 'B', 'KB', 'MB' o 'GB'.")

    converted_size = size_in_bytes / units[unit]
    return f"{converted_size:.2f} {unit}"


def convert_to_local(dt_utc: datetime) -> datetime:
    return dt_utc.replace(tzinfo=pytz.utc).astimezone(
        pytz.timezone("America/Guayaquil")
    )
