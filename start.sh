#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

PORT="${PORT:-8000}"

printf '%s\n' "SMART BauAkte startet..."
printf '%s\n' "Adresse: http://127.0.0.1:${PORT}/"
printf '%s\n' "Demo-Zugang: anna@schneider-sohn.example / demo2026"
printf '%s\n' "Hinweis: Beim ersten Start werden bauakte.db, uploads/ und backups/ lokal erzeugt."

python3 server.py
