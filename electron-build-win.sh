#!/bin/sh

docker run --rm \
  -v "$(pwd):/project" \
  -w /project \
  electronuserland/builder:wine \
  sh -c "npm install && npm run build && npx electron-builder --windows"
