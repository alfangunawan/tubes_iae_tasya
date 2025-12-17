#!/bin/bash
set -e

# Create additional databases needed by services
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE laundry_stores;
    GRANT ALL PRIVILEGES ON DATABASE laundry_stores TO laundry_user;
EOSQL
