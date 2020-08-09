#!/bin/bash

docker run -d \
-it \
  --name covidStatsApp \
  -p 127.0.0.1:8099:80 \
  covidstatsapp:1.0

