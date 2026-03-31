#!/bin/bash
# 确保 POSTGRES_DB 数据库存在
# PostgreSQL 首次初始化时自动执行此脚本
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE ${POSTGRES_DB}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}')
    \gexec
EOSQL

echo "✅ 数据库 ${POSTGRES_DB} 已确认存在"
