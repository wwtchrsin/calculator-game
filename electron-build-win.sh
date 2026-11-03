#!/bin/sh

docker run --rm \
  -v "$(pwd):/project" \
  -w /project \
  electronuserland/builder:wine \
  sh -c "npm install && npx electron-builder --windows"
